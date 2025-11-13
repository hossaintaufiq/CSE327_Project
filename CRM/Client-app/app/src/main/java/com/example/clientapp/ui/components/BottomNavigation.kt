package com.example.clientapp.ui.components

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState

data class BottomNavItem(val route: String, val label: String)

@Composable
fun BottomNavigationBar(navController: NavController) {
    val items = listOf(
        BottomNavItem("dashboard", "Dashboard"),
        BottomNavItem("leads", "Leads"),
        BottomNavItem("tasks", "Tasks"),
        BottomNavItem("analytics", "Analytics"),
        BottomNavItem("settings", "Settings")
    )

    NavigationBar {
        val navBackStackEntry by navController.currentBackStackEntryAsState()
        val currentRoute = navBackStackEntry?.destination?.route
        items.forEach { item ->
            NavigationBarItem(
                label = { Text(item.label) },
                selected = currentRoute == item.route,
                onClick = { navController.navigate(item.route) {
                    launchSingleTop = true
                    restoreState = true
                }},
                icon = {}
            )
        }
    }
}
