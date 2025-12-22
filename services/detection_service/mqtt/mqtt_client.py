"""
MQTT Client for Detection Service
Subscribes to bin detection events from Node-RED
"""

import paho.mqtt.client as mqtt
import json
import logging
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'detection_service.settings')
django.setup()

from django.conf import settings
from detection.models import MaterialDetection
from datetime import date

logger = logging.getLogger(__name__)


class DetectionMQTTClient:
    """MQTT client for subscribing to detection events"""
    
    def __init__(self):
        self.client = mqtt.Client(client_id="detection_service_subscriber")
        self.broker = settings.MQTT_BROKER
        self.port = settings.MQTT_PORT
        self.connected = False
        
        # Set up callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker"""
        if rc == 0:
            self.connected = True
            logger.info(f"✅ Connected to MQTT broker at {self.broker}:{self.port}")
            
            # Subscribe to all bin detection topics
            self.client.subscribe("bin/+/detected")
            logger.info("📡 Subscribed to: bin/+/detected")
        else:
            self.connected = False
            logger.error(f"❌ Failed to connect to MQTT broker. Return code: {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from MQTT broker"""
        self.connected = False
        if rc != 0:
            logger.warning(f"⚠️  Unexpected disconnection from MQTT broker. Return code: {rc}")
            logger.info("🔄 Attempting to reconnect...")
    
    def _on_message(self, client, userdata, msg):
        """
        Callback when message is received
        Expected message format:
        {
            "bin_id": "uuid",
            "user_nfc_code": "SB-uuid",
            "material": "plastic",
            "confidence": 0.95
        }
        """
        try:
            topic = msg.topic
            payload_str = msg.payload.decode('utf-8')
            logger.info(f"📩 RAW MQTT message received!")
            logger.info(f"   Topic: {topic}")
            logger.info(f"   Raw payload: {payload_str}")
            
            payload = json.loads(payload_str)
            
            logger.info(f"📩 Received message on {topic}")
            logger.info(f"   Parsed payload: {payload}")
            
            # Extract data - try both 'material' and 'material_type'
            # Support both old 'user_qr_code' and new 'user_nfc_code' for backward compatibility
            bin_id = payload.get('bin_id')
            user_nfc_code = payload.get('user_nfc_code') or payload.get('user_qr_code')  # Backward compatibility
            material = payload.get('material') or payload.get('material_type', 'other')
            confidence = payload.get('confidence', 0.0)
            
            logger.info(f"   Extracted: bin_id={bin_id} (type: {type(bin_id)}), user_nfc_code={user_nfc_code}, material={material}, confidence={confidence}")
            
            # Validate data
            if not bin_id or not user_nfc_code:
                logger.error("❌ Missing required fields in MQTT message")
                logger.error(f"   bin_id: {bin_id}, user_nfc_code: {user_nfc_code}")
                return
            
            # Ensure bin_id is a string (UUID field expects string)
            bin_id_str = str(bin_id).strip()
            
            # Validate UUID format
            try:
                import uuid
                uuid.UUID(bin_id_str)  # This will raise ValueError if not a valid UUID
            except (ValueError, AttributeError) as e:
                logger.error(f"❌ Invalid bin_id format (must be UUID): {bin_id_str}")
                logger.error(f"   Error: {e}")
                return
            
            logger.info(f"   Creating detection with bin_id: {bin_id_str}")
            
            # Create detection record IMMEDIATELY
            try:
                detection = MaterialDetection.objects.create(
                    bin_id=bin_id_str,
                    user_nfc_code=user_nfc_code,
                    material_type=material,
                    confidence=confidence
                )
            except Exception as e:
                logger.error(f"❌ Error creating detection record: {e}")
                import traceback
                traceback.print_exc()
                return
            
            logger.info(f"✅ Detection saved IMMEDIATELY: {detection.id} for bin {bin_id}")
            logger.info(f"   Material: {material}, Confidence: {confidence}")
            logger.info(f"   Created at: {detection.created_at}")
            
            # Award points to user
            logger.info(f"💰 Awarding points for {material}...")
            success = detection.award_points()
            
            if success:
                logger.info(f"✅ Points awarded successfully: {detection.points_awarded} points to {user_nfc_code}")
            else:
                logger.warning(f"⚠️ Failed to award points (detection still created: {detection.id})")
            
            # Update daily stats
            self._update_stats(material, detection.points_awarded)
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in MQTT message: {e}")
        except Exception as e:
            logger.error(f"❌ Error processing MQTT message: {e}")
            import traceback
            traceback.print_exc()
    
    def _update_stats(self, material, points):
        """Update daily detection statistics"""
        try:
            from detection.models import DetectionStats
            today = date.today()
            
            stats, created = DetectionStats.objects.get_or_create(date=today)
            
            stats.total_detections += 1
            stats.total_points_awarded += points
            
            # Update material-specific count
            material_count_field = f"{material}_count"
            if hasattr(stats, material_count_field):
                current_count = getattr(stats, material_count_field)
                setattr(stats, material_count_field, current_count + 1)
            
            stats.save()
            logger.info(f"📊 Stats updated for {today}")
        
        except Exception as e:
            logger.error(f"❌ Error updating stats: {e}")
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            if not self.connected:
                self.client.connect(self.broker, self.port, keepalive=settings.MQTT_KEEPALIVE)
                self.client.loop_start()
                logger.info("🚀 MQTT client started")
            return True
        except Exception as e:
            logger.error(f"❌ Error connecting to MQTT broker: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        try:
            self.client.loop_stop()
            if self.connected:
                self.client.disconnect()
            self.connected = False
            logger.info("🛑 MQTT client stopped")
        except Exception as e:
            logger.error(f"Error disconnecting: {e}")
    
    def run_forever(self):
        """Keep the MQTT client running"""
        try:
            # Connect first
            if not self.connected:
                self.client.connect(self.broker, self.port, keepalive=settings.MQTT_KEEPALIVE)
            
            # Start the loop in a non-blocking way
            self.client.loop_start()
            logger.info("🚀 MQTT client loop started")
            
            # Keep running - loop_start() runs in background thread
            import time
            while True:
                time.sleep(1)
                # Check connection status periodically
                if not self.connected:
                    logger.warning("⚠️  MQTT client disconnected, attempting reconnect...")
                    try:
                        self.client.reconnect()
                    except Exception as e:
                        logger.error(f"Reconnect error: {e}")
                        time.sleep(5)  # Wait before retry
        except KeyboardInterrupt:
            logger.info("⏹️  Stopping MQTT client...")
            self.disconnect()
        except Exception as e:
            logger.error(f"❌ Error in run_forever: {e}")
            import traceback
            traceback.print_exc()
            self.disconnect()


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Start MQTT client
    mqtt_client = DetectionMQTTClient()
    mqtt_client.run_forever()
