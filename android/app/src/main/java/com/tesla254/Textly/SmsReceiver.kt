package com.tesla254.Textly

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceiver(private val reactContext: ReactApplicationContext?) : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "SmsReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val bundle = intent.extras
            if (bundle != null) {
                val pdus = bundle["pdus"] as Array<*>?
                if (pdus != null) {
                    for (pdu in pdus) {
                        val smsMessage = SmsMessage.createFromPdu(pdu as ByteArray)
                        
                        val params: WritableMap = Arguments.createMap()
                        params.putString("address", smsMessage.displayOriginatingAddress)
                        params.putString("body", smsMessage.displayMessageBody)
                        params.putDouble("date", smsMessage.timestampMillis.toDouble())
                        params.putInt("simSlot", getSimSlot(smsMessage))
                        
                        // Send event to React Native
                        sendEvent("onSmsReceived", params)
                        
                        Log.d(TAG, "SMS received from: ${smsMessage.displayOriginatingAddress}")
                    }
                }
            }
        }
    }

    private fun getSimSlot(smsMessage: SmsMessage): Int {
        return try {
            // Try to get SIM slot from message
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP_MR1) {
                smsMessage.subscriptionId
            } else {
                0
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting SIM slot", e)
            0 // Default to SIM 1
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext?.let { context ->
            context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }
} 