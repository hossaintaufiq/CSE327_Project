package com.hossaintaufiq.crmprime.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.hossaintaufiq.crmprime.ui.screens.ClientsScreen
import com.hossaintaufiq.crmprime.ui.screens.DashboardScreen
import com.hossaintaufiq.crmprime.ui.screens.LoginScreen
import com.hossaintaufiq.crmprime.ui.screens.SignupScreen
import com.hossaintaufiq.crmprime.ui.viewmodel.AuthViewModel
import com.hossaintaufiq.crmprime.ui.viewmodel.AuthViewModelFactory

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Signup : Screen("signup")
    object Dashboard : Screen("dashboard")
    object Clients : Screen("clients")
    object Projects : Screen("projects")
    object Tasks : Screen("tasks")
    object Messages : Screen("messages")
    object Orders : Screen("orders")
    object Settings : Screen("settings")
}

@Composable
fun NavGraph(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val authViewModel: AuthViewModel = viewModel(
        factory = AuthViewModelFactory(context)
    )
    
    NavHost(
        navController = navController,
        startDestination = Screen.Login.route,
        modifier = modifier
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToSignup = {
                    navController.navigate(Screen.Signup.route)
                }
            )
        }
        
        composable(Screen.Signup.route) {
            SignupScreen(
                onSignupSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Signup.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Signup.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onNavigateToClients = {
                    navController.navigate(Screen.Clients.route)
                },
                onNavigateToProjects = {
                    navController.navigate(Screen.Projects.route)
                },
                onNavigateToTasks = {
                    navController.navigate(Screen.Tasks.route)
                },
                onNavigateToMessages = {
                    navController.navigate(Screen.Messages.route)
                },
                onNavigateToOrders = {
                    navController.navigate(Screen.Orders.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onLogout = {
                    authViewModel.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.Clients.route) {
            // Placeholder for Clients screen
            ClientsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        composable(Screen.Projects.route) {
            // Placeholder for Projects screen
            PlaceholderScreen(
                title = "Projects",
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        composable(Screen.Tasks.route) {
            // Placeholder for Tasks screen
            PlaceholderScreen(
                title = "Tasks",
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        composable(Screen.Messages.route) {
            // Placeholder for Messages screen
            PlaceholderScreen(
                title = "Messages",
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        composable(Screen.Orders.route) {
            // Placeholder for Orders screen
            PlaceholderScreen(
                title = "Orders",
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        composable(Screen.Settings.route) {
            // Placeholder for Settings screen
            PlaceholderScreen(
                title = "Settings",
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

@Composable
fun PlaceholderScreen(
    title: String,
    onNavigateBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            text = "This screen is under development",
            modifier = Modifier.padding(top = 16.dp)
        )
        Spacer(modifier = Modifier.weight(1f))
        Button(
            onClick = onNavigateBack,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Go Back")
        }
    }
}

