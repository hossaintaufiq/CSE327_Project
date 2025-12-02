package com.example.crmprime

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import com.example.crmprime.data.api.ApiClient
import com.example.crmprime.data.model.User
import com.example.crmprime.ui.navigation.NavGraph
import com.example.crmprime.ui.navigation.Screen
import com.example.crmprime.ui.theme.CRMPrimeTheme
import com.example.crmprime.ui.viewmodel.AuthViewModel
import com.example.crmprime.util.SharedPreferencesHelper

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        val prefs = SharedPreferencesHelper(this)
        val savedToken = prefs.getIdToken()
        val savedCompanyId = prefs.getCompanyId()
        
        if (savedToken != null) {
            ApiClient.setAuthToken(savedToken)
        }
        if (savedCompanyId != null) {
            ApiClient.setCompanyId(savedCompanyId)
        }
        
        setContent {
            CRMPrimeTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    CRMApp(
                        savedToken = savedToken,
                        savedCompanyId = savedCompanyId,
                        prefs = prefs
                    )
                }
            }
        }
    }
}

@Composable
fun CRMApp(
    savedToken: String?,
    savedCompanyId: String?,
    prefs: SharedPreferencesHelper
) {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel()
    
    var currentUser by remember { mutableStateOf<User?>(null) }
    var currentCompanyRole by remember { mutableStateOf<String?>(null) }
    var startDestination by remember { mutableStateOf(Screen.Login.route) }
    
    // Check if user is already logged in
    LaunchedEffect(savedToken) {
        if (savedToken != null && currentUser == null) {
            authViewModel.loadUser()
        }
    }
    
    // Observe auth state
    val authState by authViewModel.authState.collectAsState()
    
    LaunchedEffect(authState.user) {
        authState.user?.let { user ->
            currentUser = user
            
            // Super admin goes directly to dashboard
            if (user.globalRole == "super_admin") {
                startDestination = Screen.Dashboard.route
            } else if (user.companies.isNotEmpty() && savedCompanyId != null) {
                val company = user.companies.find { it.companyId == savedCompanyId && it.isActive }
                if (company != null) {
                    currentCompanyRole = company.role
                    ApiClient.setCompanyId(savedCompanyId)
                    startDestination = Screen.Dashboard.route
                } else {
                    startDestination = Screen.CompanySelection.route
                }
            } else if (user.companies.isEmpty()) {
                startDestination = Screen.CompanySelection.route
            } else {
                val firstCompany = user.companies.firstOrNull { it.isActive }
                if (firstCompany != null) {
                    currentCompanyRole = firstCompany.role
                    ApiClient.setCompanyId(firstCompany.companyId)
                    prefs.saveCompanyId(firstCompany.companyId)
                    startDestination = Screen.Dashboard.route
                } else {
                    startDestination = Screen.CompanySelection.route
                }
            }
        }
    }
    
    NavGraph(
        navController = navController,
        startDestination = startDestination,
        user = currentUser,
        companyRole = currentCompanyRole,
        onCompanySelected = { companyId, role ->
            currentCompanyRole = role
            ApiClient.setCompanyId(companyId)
            prefs.saveCompanyId(companyId)
        },
        onLogout = {
            authViewModel.logout()
            currentUser = null
            currentCompanyRole = null
            prefs.clear()
            ApiClient.setAuthToken(null)
            ApiClient.setCompanyId(null)
        }
    )
}