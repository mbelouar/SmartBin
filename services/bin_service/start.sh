#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate

echo "Starting MQTT subscriber in background..."
PYTHONPATH=/app python mqtt/mqtt_client.py &

echo "Starting Django server..."
python manage.py runserver 0.0.0.0:8000

