package com.hossaintaufiq.crmprime.data.store

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.hossaintaufiq.crmprime.data.api.ApiClient
import com.hossaintaufiq.crmprime.data.models.Company
import com.hossaintaufiq.crmprime.data.models.CompanyMembership
import com.hossaintaufiq.crmprime.data.models.User
import kotlinx.coroutines.flow.first

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_store")

class AuthStore(private val context: Context) {
    companion object {
        private val ID_TOKEN_KEY = stringPreferencesKey("id_token")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val GLOBAL_ROLE_KEY = stringPreferencesKey("global_role")
        private val ACTIVE_COMPANY_ID_KEY = stringPreferencesKey("active_company_id")
        private val ACTIVE_COMPANY_ROLE_KEY = stringPreferencesKey("active_company_role")
    }
    
    // In-memory state (similar to Zustand store)
    var user: User? = null
        private set
    var companies: List<CompanyMembership> = emptyList()
        private set
    var activeCompanyId: String? = null
        private set
    var activeCompanyRole: String? = null
        private set
    var idToken: String? = null
        private set
    
    val isSuperAdmin: Boolean
        get() = user?.globalRole == "super_admin"
    
    val hasCompany: Boolean
        get() = companies.isNotEmpty()
    
    suspend fun setIdToken(token: String?) {
        idToken = token
        ApiClient.setAuthToken(token)
        
        context.dataStore.edit { preferences ->
            if (token != null) {
                preferences[ID_TOKEN_KEY] = token
            } else {
                preferences.remove(ID_TOKEN_KEY)
            }
        }
    }
    
    suspend fun setUser(user: User?) {
        this.user = user
        this.companies = user?.companies ?: emptyList()
        
        // Set active company if available
        if (companies.isNotEmpty()) {
            val storedCompanyId = getStoredCompanyId()
            val companyToSet = when {
                storedCompanyId != null -> companies.find { it.companyId?.id == storedCompanyId }
                else -> companies.find { it.isActive } ?: companies.firstOrNull()
            }
            
            companyToSet?.let {
                setActiveCompany(it.companyId?.id, it.role)
            }
        }
        
        context.dataStore.edit { preferences ->
            if (user != null) {
                preferences[USER_ID_KEY] = user.id ?: ""
                preferences[USER_EMAIL_KEY] = user.email
                preferences[USER_NAME_KEY] = user.name ?: ""
                preferences[GLOBAL_ROLE_KEY] = user.globalRole ?: ""
            } else {
                preferences.remove(USER_ID_KEY)
                preferences.remove(USER_EMAIL_KEY)
                preferences.remove(USER_NAME_KEY)
                preferences.remove(GLOBAL_ROLE_KEY)
            }
        }
    }
    
    suspend fun setActiveCompany(companyId: String?, role: String?) {
        activeCompanyId = companyId
        activeCompanyRole = role
        ApiClient.setCompanyId(companyId)
        
        context.dataStore.edit { preferences ->
            if (companyId != null) {
                preferences[ACTIVE_COMPANY_ID_KEY] = companyId
                preferences[ACTIVE_COMPANY_ROLE_KEY] = role ?: ""
            } else {
                preferences.remove(ACTIVE_COMPANY_ID_KEY)
                preferences.remove(ACTIVE_COMPANY_ROLE_KEY)
            }
        }
    }
    
    suspend fun logout() {
        user = null
        companies = emptyList()
        activeCompanyId = null
        activeCompanyRole = null
        idToken = null
        
        ApiClient.setAuthToken(null)
        ApiClient.setCompanyId(null)
        
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
    
    suspend fun loadFromStorage() {
        val prefs = context.dataStore.data.first()
        idToken = prefs[ID_TOKEN_KEY]
        activeCompanyId = prefs[ACTIVE_COMPANY_ID_KEY]
        activeCompanyRole = prefs[ACTIVE_COMPANY_ROLE_KEY]
        
        if (idToken != null) {
            ApiClient.setAuthToken(idToken)
        }
        if (activeCompanyId != null) {
            ApiClient.setCompanyId(activeCompanyId)
        }
    }
    
    private suspend fun getStoredCompanyId(): String? {
        return context.dataStore.data.first()[ACTIVE_COMPANY_ID_KEY]
    }
}

