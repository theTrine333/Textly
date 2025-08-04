package com.tesla254.Textly

import android.app.Application
import android.content.IntentFilter
import android.telephony.TelephonyManager
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.tesla254.Textly.receivers.SmsReceiver

class MainApplication : Application(), ReactApplication {
  private lateinit var mReactNativeHost: ReactNativeHost
  private var smsReceiver: SmsReceiver? = null

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)

    // Register the SMS receiver after the JS context is ready
    if (mReactNativeHost.reactInstanceManager.hasStartedCreatingInitialContext()) {
      registerSmsReceiver(mReactNativeHost.reactInstanceManager.currentReactContext as? ReactApplicationContext)
    } else {
      mReactNativeHost.reactInstanceManager.addReactInstanceEventListener {
        registerSmsReceiver(it as? ReactApplicationContext)
      }
    }
  }

  private fun registerSmsReceiver(context: ReactApplicationContext?) {
    if (context != null && smsReceiver == null) {
      try {
        smsReceiver = SmsReceiver(context)
        val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
        registerReceiver(smsReceiver, filter)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  override fun getReactNativeHost(): ReactNativeHost {
    return mReactNativeHost
  }

  init {
    mReactNativeHost = ReactNativeHostWrapper(this,
      object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport() = BuildConfig.DEBUG

        override fun getPackages(): List<ReactPackage> {
          return PackageList(this).packages
        }

        override fun getJSMainModuleName(): String {
          return "index"
        }
      }
    )
  }
}
