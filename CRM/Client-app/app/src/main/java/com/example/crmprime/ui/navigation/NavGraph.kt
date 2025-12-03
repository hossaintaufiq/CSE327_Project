package com.example.crmprime.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.crmprime.data.model.User
import com.example.crmprime.ui.screen.CompanySelectionScreen
import com.example.crmprime.ui.screen.DashboardScreen
import com.example.crmprime.ui.screen.LoginScreen
import com.example.crmprime.ui.screen.SplashScreen

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object CompanySelection : Screen("company_selection")
    object Dashboard : Screen("dashboard")
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String,
    user: User?,
    companyRole: String?,
    onCompanySelected: (String, String) -> Unit,
    onLogout: () -> Unit
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Splash.route) {
            SplashScreen()
        }

        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {}
            )
        }

        composable(Screen.CompanySelection.route) {
            if (user != null) {
                CompanySelectionScreen(
                    companies = user.companies,
                    onCompanySelected = onCompanySelected,
                    onCreateCompany = {
                        // TODO: Navigate to create company screen or show dialog
                    }
                )
            }
        }

        composable(Screen.Dashboard.route) {
            if (user != null) {
                DashboardScreen(
                    user = user,
                    companyRole = companyRole,
                    onLogout = onLogout
                )
            }
        }
    }
}
