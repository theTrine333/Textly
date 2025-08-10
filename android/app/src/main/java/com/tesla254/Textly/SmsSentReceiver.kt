package com.tesla254.Textly

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsManager

class SmsSentReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val app = context.applicationContext as? MainApplication
        val status = when (resultCode) {
            SmsManager.RESULT_ERROR_GENERIC_FAILURE -> "SENT_FAILED"
            SmsManager.RESULT_ERROR_NO_SERVICE -> "SENT_NO_SERVICE"
            SmsManager.RESULT_ERROR_NULL_PDU -> "SENT_NULL_PDU"
            SmsManager.RESULT_ERROR_RADIO_OFF -> "SENT_RADIO_OFF"
            else -> "SENT_SUCCESS"
        }

        app?.smsModule?.sendEvent("onSmsSent", status)
    }
}
