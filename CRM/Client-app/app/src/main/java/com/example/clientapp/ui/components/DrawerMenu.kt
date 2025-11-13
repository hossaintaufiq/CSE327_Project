package com.example.clientapp.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController

@Composable
fun DrawerMenu(navController: NavController, closeDrawer: () -> Unit) {
    Column(modifier = Modifier
        .fillMaxSize()
        .padding(16.dp)
    ) {
        Text("AI CRM", style = MaterialTheme.typography.headlineSmall, modifier = Modifier.padding(bottom = 24.dp))

        val menuItems = listOf(
            "Dashboard" to "dashboard",
            "Leads" to "leads",
            "Tasks" to "tasks",
            "Analytics" to "analytics",
            "Settings" to "settings",
            "Profile" to "profile",
            "Contact" to "contact",
            "About" to "about",
            "Terms" to "terms",
            "Sales" to "sales"
        )

        menuItems.forEach { (label, route) ->
            Text(
                text = label,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        navController.navigate(route) {
                            launchSingleTop = true
                        }
                        closeDrawer()
                    }
                    .padding(vertical = 12.dp)
            )
        }
    }
}
