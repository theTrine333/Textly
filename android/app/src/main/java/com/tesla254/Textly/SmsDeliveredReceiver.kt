package com.tesla254.Textly

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.app.Activity

class SmsDeliveredReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val app = context.applicationContext as? MainApplication
        val status = when (resultCode) {
            Activity.RESULT_OK -> "DELIVERED_SUCCESS"
            else -> "DELIVERED_FAILED"
        }

        app?.smsModule?.sendEvent("onSmsDelivered", status)
    }
}
