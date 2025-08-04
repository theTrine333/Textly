package com.tesla254.Textly

import android.app.Application
import android.content.IntentFilter
import android.provider.Telephony
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.ReactInstanceManager
import com.tesla254.Textly.receivers.SmsReceiver

class MainApplication : Application(), ReactApplication {
  private lateinit var mReactNativeHost: ReactNativeHost
  private var smsReceiver: SmsReceiver? = null

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)

    val instanceManager = mReactNativeHost.reactInstanceManager
    if (instanceManager.hasStartedCreatingInitialContext()) {
      val context = instanceManager.currentReactContext
      if (context is ReactApplicationContext) {
        registerSmsReceiver(context)
      }
    } else {
      instanceManager.addReactInstanceEventListener { context ->
        if (context is ReactApplicationContext) {
          registerSmsReceiver(context)
        }
      }
    }
  }

  private fun registerSmsReceiver(context: ReactApplicationContext) {
    if (smsReceiver == null) {
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
    mReactNativeHost = ReactNativeHostWrapper(
      this,
      object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport() = BuildConfig.DEBUG

        override fun getPackages(): List<ReactPackage> {
          return PackageList(this).packages
        }

        override fun getJSMainModuleName(): String = "index"
      }
    )
  }
}
