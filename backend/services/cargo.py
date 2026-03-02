DEMO_DATA = {
    "status": "In Transit",
    "location": "Baku Hub, Terminal 2",
    "estimated_delivery": "Mar 5, 2026",
    "origin": "Istanbul, Turkey",
}

def get_cargo(tracking_number: str) -> dict:
    return DEMO_DATA