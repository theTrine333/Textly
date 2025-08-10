package com.tesla254.Textly

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.telephony.SmsMessage
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION == intent.action) {
            val bundle = intent.extras
            val format = bundle?.getString("format")
            val pdus = bundle?.get("pdus") as? Array<*>

            pdus?.forEach { pdu ->
                val smsMessage = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    SmsMessage.createFromPdu(pdu as ByteArray, format)
                } else {
                    SmsMessage.createFromPdu(pdu as ByteArray)
                }

                val sender = smsMessage.displayOriginatingAddress ?: "Unknown"
                val body = smsMessage.messageBody ?: ""
                val timestamp = smsMessage.timestampMillis

                // Send event to JS
                sendEventToJS(context, sender, body, timestamp)
            }
        }
    }

    private fun sendEventToJS(context: Context, sender: String, body: String, timestamp: Long) {
        val reactApp = context.applicationContext as? ReactApplication
        val reactContext = reactApp?.reactNativeHost?.reactInstanceManager?.currentReactContext

        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("onSmsReceived", createSmsMap(sender, body, timestamp))
    }

    private fun createSmsMap(sender: String, body: String, timestamp: Long): WritableMap {
        val map = Arguments.createMap()
        map.putString("sender", sender)
        map.putString("body", body)
        map.putDouble("timestamp", timestamp.toDouble())
        return map
    }
}
