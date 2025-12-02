package com.example.crmprime.data.api

import com.example.crmprime.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    // Change this to your backend URL
    private const val BASE_URL = "http://10.0.2.2:5000" // Use 10.0.2.2 for Android emulator to access localhost
    
    private var idToken: String? = null
    private var companyId: String? = null
    
    fun setAuthToken(token: String?) {
        idToken = token
    }
    
    fun setCompanyId(companyId: String?) {
        this.companyId = companyId
    }
    
    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val requestBuilder = original.newBuilder()
        
        idToken?.let {
            requestBuilder.addHeader("Authorization", "Bearer $it")
        }
        
        companyId?.let {
            requestBuilder.addHeader("X-Company-Id", it)
        }
        
        requestBuilder.addHeader("Content-Type", "application/json")
        chain.proceed(requestBuilder.build())
    }
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    val apiService: ApiService = retrofit.create(ApiService::class.java)
}

