package com.example.clientapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.clientapp.ui.components.BottomNavigationBar
import com.example.clientapp.ui.components.TopBar
import com.example.clientapp.ui.screens.*
import com.example.clientapp.ui.theme.AppTheme

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AppTheme {
                val navController = rememberNavController()
                MainScreen(navController)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(navController: NavHostController) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: "dashboard"

    Scaffold(
        topBar = { TopBar(title = currentRoute.replaceFirstChar { it.uppercase() }) },
        bottomBar = { BottomNavigationBar(navController = navController) }
    ) { innerPadding ->
        Column(modifier = Modifier.padding(innerPadding)) {
            AppNavigation(navController)
        }
    }
}

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(navController, startDestination = "dashboard") {
        composable("dashboard") { DashboardScreen() }
        composable("leads") { LeadsScreen() }
        composable("sales") { SalesScreen() }
        composable("analytics") { AnalyticsScreen() }
        composable("tasks") { TasksScreen() }
        composable("settings") { SettingsScreen() }
        composable("profile") { ProfileScreen() }
        composable("contact") { ContactScreen() }
        composable("about") { AboutScreen() }
        composable("terms") { TermsScreen() }
    }
}
