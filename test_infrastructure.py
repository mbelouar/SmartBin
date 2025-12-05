#!/usr/bin/env python3
"""
Infrastructure Test Script for SmartBin
Tests PostgreSQL and MQTT connectivity
"""

import sys
import time

def test_postgres():
    """Test PostgreSQL connection"""
    print("\n🔍 Testing PostgreSQL connection...")
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost",
            database="smartbin_db",
            user="smartbin_user",
            password="smartbin_pass",
            port=5432
        )
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"✅ PostgreSQL connected successfully!")
        print(f"   Version: {version[0][:50]}...")
        
        # Test schemas
        cur.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('auth', 'bins', 'detection', 'reclamation');")
        schemas = cur.fetchall()
        print(f"   Schemas found: {[s[0] for s in schemas]}")
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False

def test_mqtt():
    """Test MQTT broker connection"""
    print("\n🔍 Testing MQTT broker connection...")
    try:
        import paho.mqtt.client as mqtt
        
        connected = False
        
        def on_connect(client, userdata, flags, rc):
            nonlocal connected
            if rc == 0:
                connected = True
                print("✅ MQTT broker connected successfully!")
                client.subscribe("test/smartbin")
            else:
                print(f"❌ MQTT connection failed with code: {rc}")
        
        def on_message(client, userdata, msg):
            print(f"   Message received on {msg.topic}: {msg.payload.decode()}")
        
        client = mqtt.Client("test_client")
        client.on_connect = on_connect
        client.on_message = on_message
        
        client.connect("localhost", 1883, 60)
        client.loop_start()
        
        # Wait for connection
        timeout = 10
        start_time = time.time()
        while not connected and (time.time() - start_time) < timeout:
            time.sleep(0.1)
        
        if connected:
            # Publish test message
            print("   Publishing test message...")
            client.publish("test/smartbin", "Hello from SmartBin!")
            time.sleep(1)
            
            client.loop_stop()
            client.disconnect()
            return True
        else:
            print("❌ MQTT connection timeout")
            return False
            
    except Exception as e:
        print(f"❌ MQTT test failed: {e}")
        return False

def main():
    """Run all infrastructure tests"""
    print("=" * 60)
    print("🚀 SmartBin Infrastructure Test Suite")
    print("=" * 60)
    
    # Check required packages
    print("\n📦 Checking required packages...")
    try:
        import psycopg2
        print("   ✅ psycopg2 installed")
    except ImportError:
        print("   ❌ psycopg2 not installed. Run: pip install psycopg2-binary")
        return False
    
    try:
        import paho.mqtt.client
        print("   ✅ paho-mqtt installed")
    except ImportError:
        print("   ❌ paho-mqtt not installed. Run: pip install paho-mqtt")
        return False
    
    # Run tests
    postgres_ok = test_postgres()
    mqtt_ok = test_mqtt()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    print(f"PostgreSQL: {'✅ PASS' if postgres_ok else '❌ FAIL'}")
    print(f"MQTT Broker: {'✅ PASS' if mqtt_ok else '❌ FAIL'}")
    print("=" * 60)
    
    if postgres_ok and mqtt_ok:
        print("\n🎉 All infrastructure tests passed!")
        print("\nNext steps:")
        print("1. Stop test containers: docker-compose -f docker-compose.test.yml down")
        print("2. Build Django services")
        print("3. Run full system: docker-compose up --build")
        return True
    else:
        print("\n⚠️  Some tests failed. Please check the logs above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
