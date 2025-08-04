package com.tesla254.Textly

import android.Manifest
import android.app.Activity
import android.app.PendingIntent
import android.content.*
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Telephony
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "SmsModule"
        private const val SMS_PERMISSION_REQUEST = 123
        private const val SMS_SENT = "SMS_SENT"
        private const val SMS_DELIVERED = "SMS_DELIVERED"
    }

    private var smsSentReceiver: BroadcastReceiver? = null
    private var smsDeliveredReceiver: BroadcastReceiver? = null

    init {
        setupSmsReceivers()
        SmsReceiver.register(reactContext) // Register incoming SMS receiver
    }

    override fun getName(): String = "SmsModule"

    private fun setupSmsReceivers() {
        // SMS Sent Receiver
        smsSentReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val messageId = intent.getStringExtra("message_id")
                val resultCode = resultCode

                val params: WritableMap = Arguments.createMap()
                params.putString("messageId", messageId)
                params.putString("status", if (resultCode == Activity.RESULT_OK) "sent" else "failed")

                sendEvent("onSmsSent", params)
            }
        }

        // SMS Delivered Receiver
        smsDeliveredReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val messageId = intent.getStringExtra("message_id")

                val params: WritableMap = Arguments.createMap()
                params.putString("messageId", messageId)
                params.putString("status", "delivered")

                sendEvent("onSmsDelivered", params)
            }
        }

        reactContext.registerReceiver(smsSentReceiver, IntentFilter(SMS_SENT))
        reactContext.registerReceiver(smsDeliveredReceiver, IntentFilter(SMS_DELIVERED))
    }

    @ReactMethod
    fun sendSMS(phoneNumber: String, message: String, simSlot: Int, promise: Promise) {
        try {
            if (!hasSmsPermission()) {
                promise.reject("PERMISSION_DENIED", "SMS permission not granted")
                return
            }

            val smsManager = getSmsManagerForSimSlot(simSlot)

            val messageId = "sms_${System.currentTimeMillis()}"

            val sentIntent = Intent(SMS_SENT).apply {
                putExtra("message_id", messageId)
            }
            val deliveredIntent = Intent(SMS_DELIVERED).apply {
                putExtra("message_id", messageId)
            }

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            else PendingIntent.FLAG_UPDATE_CURRENT

            val sentPI = PendingIntent.getBroadcast(reactContext, 0, sentIntent, flags)
            val deliveredPI = PendingIntent.getBroadcast(reactContext, 0, deliveredIntent, flags)

            if (message.length > 160) {
                val parts = smsManager.divideMessage(message)
                val sentIntents = ArrayList<PendingIntent>()
                val deliveredIntents = ArrayList<PendingIntent>()
                repeat(parts.size) {
                    sentIntents.add(sentPI)
                    deliveredIntents.add(deliveredPI)
                }
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, sentIntents, deliveredIntents)
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, sentPI, deliveredPI)
            }

            promise.resolve(messageId)
        } catch (e: Exception) {
            promise.reject("SMS_SEND_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isDefaultSMSApp(promise: Promise) {
        try {
            val defaultSmsApp = Telephony.Sms.getDefaultSmsPackage(reactContext)
            val isDefault = defaultSmsApp == reactContext.packageName
            promise.resolve(isDefault)
        } catch (e: Exception) {
            promise.reject("DEFAULT_SMS_CHECK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestDefaultSMSApp(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                val intent = Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT).apply {
                    putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, reactContext.packageName)
                }

                currentActivity?.startActivityForResult(intent, SMS_PERMISSION_REQUEST)
                    ?: promise.reject("ACTIVITY_ERROR", "No current activity available")
            } else {
                promise.reject("API_LEVEL_ERROR", "Default SMS app request not supported on this API level")
            }
        } catch (e: Exception) {
            promise.reject("DEFAULT_SMS_REQUEST_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestSmsPermissions(promise: Promise) {
        try {
            currentActivity?.let {
                val permissions = arrayOf(
                    Manifest.permission.SEND_SMS,
                    Manifest.permission.READ_SMS,
                    Manifest.permission.RECEIVE_SMS
                )
                ActivityCompat.requestPermissions(it, permissions, SMS_PERMISSION_REQUEST)
                promise.resolve(true)
            } ?: promise.reject("ACTIVITY_ERROR", "No current activity available")
        } catch (e: Exception) {
            promise.reject("PERMISSION_REQUEST_ERROR", e.message, e)
        }
    }

    private fun hasSmsPermission(): Boolean {
        val permissions = arrayOf(
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_SMS,
            Manifest.permission.RECEIVE_SMS
        )
        return permissions.all {
            ContextCompat.checkSelfPermission(reactContext, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun getSmsManagerForSimSlot(simSlot: Int): SmsManager {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val subscriptionManager =
                reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
            val subscriptionId = getSubscriptionId(simSlot)
            if (subscriptionId != -1 && subscriptionManager != null) {
                return reactContext.getSystemService(SmsManager::class.java)
                    ?.createForSubscriptionId(subscriptionId)
                    ?: SmsManager.getDefault()
            }
        }
        return SmsManager.getDefault()
    }

    private fun getSubscriptionId(simSlot: Int): Int {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                val subscriptionManager =
                    reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
                subscriptionManager?.activeSubscriptionInfoList?.firstOrNull {
                    it.simSlotIndex == simSlot
                }?.subscriptionId ?: -1
            } else {
                -1
            }
        } catch (e: Exception) {
            -1
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()

        smsSentReceiver?.let {
            try {
                reactContext.unregisterReceiver(it)
            } catch (_: Exception) {}
        }
        smsDeliveredReceiver?.let {
            try {
                reactContext.unregisterReceiver(it)
            } catch (_: Exception) {}
        }

        // Unregister SMS receiver for incoming messages
        SmsReceiver.unregister(reactContext)
    }
}
