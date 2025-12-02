package com.example.crmprime.util

import android.content.Context
import android.content.SharedPreferences

class SharedPreferencesHelper(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "CRMPrimePrefs",
        Context.MODE_PRIVATE
    )
    
    fun saveIdToken(token: String) {
        prefs.edit().putString("idToken", token).apply()
    }
    
    fun getIdToken(): String? {
        return prefs.getString("idToken", null)
    }
    
    fun saveCompanyId(companyId: String) {
        prefs.edit().putString("companyId", companyId).apply()
    }
    
    fun getCompanyId(): String? {
        return prefs.getString("companyId", null)
    }
    
    fun clear() {
        prefs.edit().clear().apply()
    }
}

