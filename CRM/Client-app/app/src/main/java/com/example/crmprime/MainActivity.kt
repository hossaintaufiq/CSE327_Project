package com.example.crmprime

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import com.example.crmprime.data.api.ApiClient
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
        prefs.getIdToken()?.let { ApiClient.setAuthToken(it) }
        prefs.getCompanyId()?.let { ApiClient.setCompanyId(it) }

        setContent {
            CRMPrimeTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    CRMApp(prefs = prefs)
                }
            }
        }
    }
}

@Composable
fun CRMApp(prefs: SharedPreferencesHelper) {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel()
    val authState by authViewModel.authState.collectAsState()

    LaunchedEffect(Unit) {
        if (prefs.getIdToken() != null) {
            authViewModel.loadUser()
        }
    }

    LaunchedEffect(authState) {
        val route = navController.currentBackStackEntry?.destination?.route
        if (authState.user != null) {
            val user = authState.user!!
            val companyId = prefs.getCompanyId()
            val destination = if (user.globalRole == "super_admin" || (companyId != null && user.companies.any { it.companyId == companyId && it.isActive })) {
                Screen.Dashboard.route
            } else {
                Screen.CompanySelection.route
            }
            if (route != destination) {
                navController.navigate(destination) {
                    popUpTo(navController.graph.id) { inclusive = true }
                }
            }
        } else if (authState.error != null) {
            if (route != Screen.Login.route) {
                navController.navigate(Screen.Login.route) {
                    popUpTo(navController.graph.id) { inclusive = true }
                }
            }
        }
    }
    
    val startDestination = if (prefs.getIdToken() == null) Screen.Login.route else Screen.Splash.route

    NavGraph(
        navController = navController,
        startDestination = startDestination,
        user = authState.user,
        companyRole = authState.user?.let { user ->
            prefs.getCompanyId()?.let { companyId ->
                user.companies.find { it.companyId == companyId }?.role
            }
        },
        onCompanySelected = { companyId, role ->
            prefs.saveCompanyId(companyId)
            ApiClient.setCompanyId(companyId)
            navController.navigate(Screen.Dashboard.route) {
                popUpTo(Screen.CompanySelection.route) { inclusive = true }
            }
        },
        onLogout = {
            authViewModel.logout()
            prefs.clear()
            ApiClient.setAuthToken(null)
            ApiClient.setCompanyId(null)
            navController.navigate(Screen.Login.route) {
                popUpTo(navController.graph.id) { inclusive = true }
            }
        }
    )
}