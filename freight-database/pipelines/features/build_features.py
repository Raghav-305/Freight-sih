import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text

DB_URL = os.environ.get("FREIGHT_DATABASE_URL")
if not DB_URL:
    raise RuntimeError("Set FREIGHT_DATABASE_URL before building freight-database features.")
ENGINE = create_engine(DB_URL)

def build_gold_feature_table():
    print("Reading clean source tables from database...")
    
    with ENGINE.connect() as conn:
        # 1. Fetch historical freight rates
        freight_query = text("""
            SELECT time, route_id, vessel_class, freight_usd_mt 
            FROM freight_rates 
            ORDER BY time ASC;
        """)
        df_freight = pd.read_sql(freight_query, conn)
        
        if df_freight.empty:
            print("No freight rates available to build features.")
            return

        df_freight['time'] = pd.to_datetime(df_freight['time']).dt.tz_localize(None)
        
        # Deduplicate across composite key to prevent primary key conflicts (Phase 8)
        df_freight = df_freight.drop_duplicates(subset=['time', 'route_id', 'vessel_class'])
        df_freight = df_freight.sort_values(by=['route_id', 'vessel_class', 'time'])

        # 2. Fetch commodity prices (Coal)
        coal_query = text("""
            SELECT time, price as coal_price 
            FROM commodity_prices 
            WHERE commodity ILIKE '%%Coal%%' 
            ORDER BY time ASC;
        """)
        df_coal = pd.read_sql(coal_query, conn)
        if not df_coal.empty:
            df_coal['time'] = pd.to_datetime(df_coal['time']).dt.tz_localize(None)
            df_coal = df_coal.drop_duplicates(subset=['time'])

        # 3. Fetch bunker fuel prices
        bunker_query = text("""
            SELECT time, price as bunker_price 
            FROM bunker_prices 
            WHERE fuel_type = 'VLSFO' 
            ORDER BY time ASC;
        """)
        df_bunker = pd.read_sql(bunker_query, conn)
        if not df_bunker.empty:
            df_bunker['time'] = pd.to_datetime(df_bunker['time']).dt.tz_localize(None)
            df_bunker = df_bunker.drop_duplicates(subset=['time'])

        # 4. Merge time-series datasets
        merged_df = df_freight.copy()
        if not df_coal.empty:
            merged_df = pd.merge(merged_df, df_coal, on='time', how='left')
        else:
            merged_df['coal_price'] = np.nan

        if not df_bunker.empty:
            merged_df = pd.merge(merged_df, df_bunker, on='time', how='left')
        else:
            merged_df['bunker_price'] = np.nan

        merged_df['coal_price'] = merged_df['coal_price'].ffill().bfill()
        merged_df['bunker_price'] = merged_df['bunker_price'].ffill().bfill()

        # 5. Compute Lags, Moving Averages, and Volatility (Phase 12 & 13)
        grouped = merged_df.groupby(['route_id', 'vessel_class'])
        
        merged_df['freight_today'] = merged_df['freight_usd_mt']
        merged_df['freight_lag_1'] = grouped['freight_usd_mt'].shift(1)
        merged_df['freight_lag_3'] = grouped['freight_usd_mt'].shift(3)
        merged_df['freight_lag_7'] = grouped['freight_usd_mt'].shift(7)
        merged_df['freight_lag_14'] = grouped['freight_usd_mt'].shift(14)
        merged_df['freight_lag_30'] = grouped['freight_usd_mt'].shift(30)

        merged_df['freight_ma_7'] = grouped['freight_usd_mt'].transform(lambda x: x.rolling(7, min_periods=1).mean())
        merged_df['freight_ma_30'] = grouped['freight_usd_mt'].transform(lambda x: x.rolling(30, min_periods=1).mean())
        merged_df['freight_volatility_7'] = grouped['freight_usd_mt'].transform(lambda x: x.rolling(7, min_periods=1).std()).fillna(0)
        merged_df['freight_volatility_30'] = grouped['freight_usd_mt'].transform(lambda x: x.rolling(30, min_periods=1).std()).fillna(0)

        # Calendar dimensions
        merged_df['month'] = merged_df['time'].dt.month
        merged_df['week'] = merged_df['time'].dt.isocalendar().week.astype(int)
        merged_df['day_of_week'] = merged_df['time'].dt.dayofweek

        # 6. Select columns matching route_daily_features table
        feature_cols = [
            'time', 'route_id', 'vessel_class', 'freight_today',
            'freight_lag_1', 'freight_lag_3', 'freight_lag_7', 'freight_lag_14', 'freight_lag_30',
            'freight_ma_7', 'freight_ma_30', 'freight_volatility_7', 'freight_volatility_30',
            'coal_price', 'bunker_price', 'month', 'week', 'day_of_week'
        ]

        final_features = merged_df[feature_cols].drop_duplicates(subset=['time', 'route_id', 'vessel_class']).copy()
        
        # Truncate and reload features cleanly
        conn.execute(text("TRUNCATE TABLE route_daily_features;"))
        conn.commit()

        final_features.to_sql('route_daily_features', conn, if_exists='append', index=False, method='multi')
        conn.commit()
        print(f"[Phase D] Successfully engineered and loaded {len(final_features)} feature rows into route_daily_features!")

if __name__ == "__main__":
    build_gold_feature_table()