package com.tesla254.Textly

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceiver(private val reactContext: ReactApplicationContext) : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsReceiver"
        private var smsIncomingReceiver: SmsReceiver? = null

        fun register(reactContext: ReactApplicationContext) {
            // Check if the app is the default SMS app
            val defaultSmsPackage = Telephony.Sms.getDefaultSmsPackage(reactContext)
            if (defaultSmsPackage != reactContext.packageName) {
                Log.w(TAG, "App is not the default SMS app: $defaultSmsPackage")
                return
            }

            if (smsIncomingReceiver == null) {
                smsIncomingReceiver = SmsReceiver(reactContext)
                val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
                filter.priority = IntentFilter.SYSTEM_HIGH_PRIORITY
                reactContext.registerReceiver(smsIncomingReceiver, filter)
                Log.d(TAG, "SmsReceiver registered")
            }
        }

        fun unregister(reactContext: ReactApplicationContext) {
            smsIncomingReceiver?.let {
                reactContext.unregisterReceiver(it)
                smsIncomingReceiver = null
                Log.d(TAG, "SmsReceiver unregistered")
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val bundle = intent.extras
            if (bundle != null) {
                val pdus = bundle["pdus"] as? Array<*>
                val format = bundle.getString("format") // required for Android M+
                val subId = bundle.getInt("subscription", -1)
                val simSlot = bundle.getInt("slot", 0)

                if (pdus != null) {
                    for (pdu in pdus) {
                        val smsMessage = try {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                SmsMessage.createFromPdu(pdu as ByteArray, format)
                            } else {
                                SmsMessage.createFromPdu(pdu as ByteArray)
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "Error parsing SMS PDU", e)
                            continue
                        }

                        val params: WritableMap = Arguments.createMap()
                        params.putString("address", smsMessage.displayOriginatingAddress)
                        params.putString("body", smsMessage.displayMessageBody)
                        params.putDouble("date", smsMessage.timestampMillis.toDouble())
                        params.putInt("subscriptionId", subId)
                        params.putInt("simSlot", simSlot)

                        sendEvent("onSmsReceived", params)
                        Log.d(TAG, "SMS received from: ${smsMessage.displayOriginatingAddress}")
                    }
                }
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
