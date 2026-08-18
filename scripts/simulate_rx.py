#!/usr/bin/env python3
"""
MAREA IoT Telemetry Simulator (TTGO LoRa32 RX Buoy Emulator)
Generates realistic lagoon environmental telemetry:
- Sea-water temperature with diurnal cycle and realistic marine thermal inertia
- Wave motion (acceleration & angular velocity from MPU6050 IMU)
- GPS coordinates in Bizerte Lagoon with simulated micro-drift
- LoRa link metrics (RSSI / SNR)
"""

import sys
import time
import math
import random
import argparse
import urllib.request
import urllib.error
import json
from datetime import datetime, timezone

def generate_telemetry(seq: int, node_name: str = "MAREA_BUOY_01", base_temp: float = 22.5) -> dict:
    now = datetime.now(timezone.utc)
    hour = now.hour + now.minute / 60.0
    
    # 1. Diurnal thermal variation (peak around 15:00, trough around 05:00)
    diurnal_temp = 1.2 * math.sin((hour - 9.0) / 24.0 * 2.0 * math.pi)
    noise_temp = random.uniform(-0.15, 0.15)
    temp = round(base_temp + diurnal_temp + noise_temp, 2)
    
    # 2. Wave dynamic motion (MPU6050: swell period ~4.5s)
    t = time.time()
    wave_phase = (t % 4.5) / 4.5 * 2.0 * math.pi
    ax = round(0.45 * math.sin(wave_phase) + random.uniform(-0.05, 0.05), 3)
    ay = round(0.35 * math.cos(wave_phase) + random.uniform(-0.05, 0.05), 3)
    az = round(9.81 + 0.80 * math.sin(wave_phase * 2) + random.uniform(-0.08, 0.08), 3)
    
    gx = round(0.045 * math.cos(wave_phase) + random.uniform(-0.005, 0.005), 4)
    gy = round(0.038 * math.sin(wave_phase) + random.uniform(-0.005, 0.005), 4)
    gz = round(random.uniform(-0.008, 0.008), 4)
    
    # 3. GPS in Bizerte Lagoon (37.2745° N, 9.8732° E) with realistic mooring radius
    drift_lat = 0.00015 * math.sin(t / 120.0)
    drift_lon = 0.00015 * math.cos(t / 120.0)
    lat = round(37.274500 + drift_lat, 6)
    lon = round(9.873200 + drift_lon, 6)
    
    # 4. LoRa link quality
    rssi = random.randint(-85, -62)
    snr = round(random.uniform(7.5, 11.2), 2)
    
    return {
        "node_name": node_name,
        "seq": seq,
        "tempOK": 1,
        "temp": temp,
        "mpuOK": 1,
        "ax": ax,
        "ay": ay,
        "az": az,
        "gx": gx,
        "gy": gy,
        "gz": gz,
        "gpsOK": 1,
        "lat": lat,
        "lon": lon,
        "sats": random.randint(7, 11),
        "alt": round(random.uniform(0.8, 1.4), 1),
        "hdop": round(random.uniform(0.8, 1.2), 2),
        "rssi": rssi,
        "snr": snr,
        "timestamp": now.isoformat()
    }

def send_packet(url: str, packet: dict) -> bool:
    data = json.dumps(packet).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "MAREA-Simulator/1.0"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status in (200, 201):
                return True
            print(f"[-] HTTP Status {response.status}")
            return False
    except Exception as e:
        print(f"[-] HTTP POST error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="MAREA IoT Buoy Telemetry Simulator")
    parser.add_argument("--url", default="http://localhost:5000/api/telemetry", help="Target Ingestion URL")
    parser.add_argument("--interval", type=float, default=5.0, help="Dispatch interval in seconds (default: 5s)")
    parser.add_argument("--count", type=int, default=0, help="Number of packets to send (0 = infinite)")
    parser.add_argument("--node", default="MAREA_BUOY_01", help="Node name")
    args = parser.parse_args()

    print("==========================================================")
    print("  MAREA IOT BUOY SIMULATOR (17-Field LoRa/WiFi Gateway)   ")
    print(f"  Target:   {args.url}")
    print(f"  Node:     {args.node}")
    print(f"  Interval: {args.interval}s")
    print("==========================================================")

    seq = 1
    sent = 0
    try:
        while True:
            packet = generate_telemetry(seq, node_name=args.node)
            print(f"[# {seq}] T: {packet['temp']}°C | Accel: ({packet['ax']},{packet['ay']},{packet['az']}) | Lat/Lon: {packet['lat']},{packet['lon']} | RSSI: {packet['rssi']}dBm", end=" ")
            
            success = send_packet(args.url, packet)
            if success:
                print(" -> [OK]")
            else:
                print(" -> [FAIL]")
            
            sent += 1
            seq += 1
            if args.count > 0 and sent >= args.count:
                break
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n[!] Simulator stopped by user.")

if __name__ == "__main__":
    main()
