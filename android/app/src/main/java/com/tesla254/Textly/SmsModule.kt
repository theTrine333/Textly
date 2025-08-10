package com.tesla254.Textly

import android.app.Activity
import android.content.Intent
import android.provider.Telephony
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.telephony.SmsManager
import com.facebook.react.bridge.*

class SmsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SmsModule"

    @ReactMethod
    fun sendSms(phoneNumber: String, message: String) {
        val context = reactApplicationContext
        val smsManager = SmsManager.getDefault()

        // Sent Intent
        val sentIntent = Intent(context, SmsSentReceiver::class.java)
        val sentPI = PendingIntent.getBroadcast(
            context, 0, sentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Delivery Intent
        val deliveredIntent = Intent(context, SmsDeliveredReceiver::class.java)
        val deliveredPI = PendingIntent.getBroadcast(
            context, 0, deliveredIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        smsManager.sendTextMessage(phoneNumber, null, message, sentPI, deliveredPI)
    }


    @ReactMethod
    fun getAllSms(promise: Promise) {
        try {
            val smsList = Arguments.createArray()
            val uri = Uri.parse("content://sms/")
            val cursor: Cursor? = reactContext.contentResolver.query(
                uri, null, null, null, "date DESC"
            )
            cursor?.use {
                while (it.moveToNext()) {
                    val sms = Arguments.createMap()
                    sms.putString("address", it.getString(it.getColumnIndexOrThrow("address")))
                    sms.putString("body", it.getString(it.getColumnIndexOrThrow("body")))
                    sms.putDouble("date", it.getLong(it.getColumnIndexOrThrow("date")).toDouble())
                    sms.putString("thread_id", it.getString(it.getColumnIndexOrThrow("thread_id")))
                    smsList.pushMap(sms)
                }
            }
            promise.resolve(smsList)
        } catch (e: Exception) {
            promise.reject("READ_SMS_ERROR", e)
        }
    }

    @ReactMethod
    fun searchSms(
        contact: String?,
        startDate: Double?,
        endDate: Double?,
        threadId: String?,
        messageContent: String?,
        promise: Promise
    ) {
        try {
            val selectionParts = mutableListOf<String>()
            val selectionArgs = mutableListOf<String>()

            if (!contact.isNullOrEmpty()) {
                selectionParts.add("address LIKE ?")
                selectionArgs.add("%$contact%")
            }
            if (startDate != null) {
                selectionParts.add("date >= ?")
                selectionArgs.add(startDate.toLong().toString())
            }
            if (endDate != null) {
                selectionParts.add("date <= ?")
                selectionArgs.add(endDate.toLong().toString())
            }
            if (!threadId.isNullOrEmpty()) {
                selectionParts.add("thread_id = ?")
                selectionArgs.add(threadId)
            }
            if (!messageContent.isNullOrEmpty()) {
                selectionParts.add("body LIKE ?")
                selectionArgs.add("%$messageContent%")
            }

            val selection = if (selectionParts.isNotEmpty()) selectionParts.joinToString(" AND ") else null
            val cursor: Cursor? = reactContext.contentResolver.query(
                Uri.parse("content://sms/"),
                null,
                selection,
                if (selectionArgs.isNotEmpty()) selectionArgs.toTypedArray() else null,
                "date DESC"
            )

            val smsList = Arguments.createArray()
            cursor?.use {
                while (it.moveToNext()) {
                    val sms = Arguments.createMap()
                    sms.putString("address", it.getString(it.getColumnIndexOrThrow("address")))
                    sms.putString("body", it.getString(it.getColumnIndexOrThrow("body")))
                    sms.putDouble("date", it.getLong(it.getColumnIndexOrThrow("date")).toDouble())
                    sms.putString("thread_id", it.getString(it.getColumnIndexOrThrow("thread_id")))
                    smsList.pushMap(sms)
                }
            }
            promise.resolve(smsList)
        } catch (e: Exception) {
            promise.reject("SEARCH_SMS_ERROR", e)
        }
    }

    @ReactMethod
    fun requestDefaultSmsApp(promise: Promise) {
        try {
            val activity: Activity? = currentActivity
            if (activity != null) {
                val myPackageName = reactContext.packageName
                val intent = Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT)
                intent.putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, myPackageName)
                activity.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.reject("NO_ACTIVITY", "Current activity is null")
            }
        } catch (e: Exception) {
            promise.reject("DEFAULT_SMS_ERROR", e)
        }
    }
}
