package com.example.crmprime.ui.navigation

import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.crmprime.data.model.User
import com.example.crmprime.ui.screen.*

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object CompanySelection : Screen("company_selection")
    object Dashboard : Screen("dashboard")
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Login.route,
    user: User? = null,
    companyRole: String? = null,
    onCompanySelected: (String, String) -> Unit = { _, _ -> },
    onLogout: () -> Unit = {}
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.CompanySelection.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.CompanySelection.route) {
            CompanySelectionScreen(
                companies = user?.companies ?: emptyList(),
                onCompanySelected = { companyId, role ->
                    onCompanySelected(companyId, role)
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.CompanySelection.route) { inclusive = true }
                    }
                },
                onCreateCompany = {
                    // Navigate to create company screen or show dialog
                }
            )
        }
        
        composable(Screen.Dashboard.route) {
            if (user != null) {
                DashboardScreen(
                    user = user,
                    companyRole = companyRole,
                    onLogout = {
                        onLogout()
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}

