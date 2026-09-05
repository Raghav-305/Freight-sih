from backend.app.services import imd_adapter, map_data


def test_static_layers_render_without_network():
    for layer_name in ("ports", "corridors", "chokepoints"):
        out = map_data.get_layer(layer_name)
        assert out["truth_class"] == "STATIC_REFERENCE"
        assert len(out["geojson"]["features"]) > 0
        assert out["freshness"]["status"] == "AVAILABLE_OFFLINE"


def test_mocked_hazard_layer_is_tagged_demo_not_live():
    out = imd_adapter.return_with_freshness()
    assert out["status"] == "DEMO_SIMULATION"
    assert out["status"] != "OFFICIAL_PERIODIC"


def test_failed_live_adapter_never_relabels_stale_as_live(monkeypatch):
    monkeypatch.setenv("IMD_LIVE", "1")
    import importlib
    from backend.app.services import imd_adapter as mod
    importlib.reload(mod)

    out = mod.return_with_freshness()
    assert out["status"] in ("FAILED_NO_CACHE", "FAILED_SHOWING_LAST_KNOWN_STALE")
    assert out["status"] != "OFFICIAL_PERIODIC"

    importlib.reload(mod)
