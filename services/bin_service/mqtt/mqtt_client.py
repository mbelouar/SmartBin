"""
MQTT Client for Bin Service
Publishes bin open/close commands to MQTT broker for Node-RED
"""

import paho.mqtt.client as mqtt
import json
import logging
from django.conf import settings

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BinMQTTClient:
    """MQTT client for publishing bin commands"""
    
    def __init__(self):
        self.client = mqtt.Client(client_id="bin_service_publisher")
        self.broker = settings.MQTT_BROKER
        self.port = settings.MQTT_PORT
        self.connected = False
        
        # Set up callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker"""
        if rc == 0:
            self.connected = True
            logger.info(f"Connected to MQTT broker at {self.broker}:{self.port}")
        else:
            self.connected = False
            logger.error(f"Failed to connect to MQTT broker. Return code: {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from MQTT broker"""
        self.connected = False
        if rc != 0:
            logger.warning(f"Unexpected disconnection from MQTT broker. Return code: {rc}")
    
    def _on_publish(self, client, userdata, mid):
        """Callback when message is published"""
        logger.debug(f"Message published with mid: {mid}")
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(self.broker, self.port, keepalive=settings.MQTT_KEEPALIVE)
            self.client.loop_start()
            return True
        except Exception as e:
            logger.error(f"Error connecting to MQTT broker: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        self.client.loop_stop()
        self.client.disconnect()
        self.connected = False
    
    def publish_bin_command(self, bin_id, command, user_nfc_code=None):
        """
        Publish bin command to MQTT
        
        Args:
            bin_id: UUID of the bin
            command: 'open' or 'close'
            user_nfc_code: NFC code of user (for open command)
        """
        topic = f"bin/{bin_id}/{command}"
        
        payload = {
            "bin_id": str(bin_id),
            "command": command,
            "timestamp": None  # Will be set by MQTT
        }
        
        if user_nfc_code and command == 'open':
            payload["user_nfc_code"] = user_nfc_code
        
        try:
            if not self.connected:
                self.connect()
            
            result = self.client.publish(
                topic,
                json.dumps(payload),
                qos=1
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Published {command} command for bin {bin_id} to topic: {topic}")
                return True
            else:
                logger.error(f"Failed to publish message. Error code: {result.rc}")
                return False
        
        except Exception as e:
            logger.error(f"Error publishing to MQTT: {e}")
            return False
    
    def open_bin(self, bin_id, user_nfc_code):
        """Publish open command for bin"""
        return self.publish_bin_command(bin_id, 'open', user_nfc_code)
    
    def close_bin(self, bin_id):
        """Publish close command for bin"""
        return self.publish_bin_command(bin_id, 'close')


# Global MQTT client instance
mqtt_client = BinMQTTClient()

# Auto-connect on import (will connect when Django starts)
try:
    mqtt_client.connect()
    logger.info("MQTT client initialized and connecting...")
except Exception as e:
    logger.warning(f"MQTT client initialization failed (will retry on first publish): {e}")
