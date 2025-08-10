package com.tesla254.Textly

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.app.Activity
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsDeliveredReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val status = when (resultCode) {
            Activity.RESULT_OK -> "DELIVERED_SUCCESS"
            else -> "DELIVERED_FAILED"
        }

        // Emit event to JS
        val reactContext = context.applicationContext as? ReactApplication
        if (reactContext != null && reactContext is ReactApplication) {
            val reactAppContext = (reactContext as ReactApplication).reactNativeHost.reactInstanceManager.currentReactContext
            reactAppContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onSmsDelivered", status)
        }
    }
}
