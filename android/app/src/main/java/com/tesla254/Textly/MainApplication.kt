package com.tesla254.Textly

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import com.tesla254.Textly.SmsPackage

class MainApplication : Application(), ReactApplication {

  private val mReactNativeHost = ReactNativeHostWrapper(
    this,
    object : ReactNativeHost(this) {
      override fun getUseDeveloperSupport() = BuildConfig.DEBUG

      override fun getPackages(): List<ReactPackage> {
        val packages = PackageList(this).packages
        packages.add(SmsPackage())
        return packages
      }

      override fun getJSMainModuleName(): String = "index"
    }
  )

  override fun getReactNativeHost(): ReactNativeHost {
    return mReactNativeHost
  }

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }
}
