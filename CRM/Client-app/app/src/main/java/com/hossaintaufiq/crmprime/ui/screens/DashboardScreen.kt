package com.hossaintaufiq.crmprime.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import android.content.Context
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.hossaintaufiq.crmprime.ui.viewmodel.AuthViewModel
import com.hossaintaufiq.crmprime.ui.viewmodel.AuthViewModelFactory

@Composable
fun DashboardScreen(
    onNavigateToClients: () -> Unit,
    onNavigateToProjects: () -> Unit,
    onNavigateToTasks: () -> Unit,
    onNavigateToMessages: () -> Unit,
    onNavigateToOrders: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val viewModel: AuthViewModel = viewModel(factory = AuthViewModelFactory(context))
    val uiState by viewModel.uiState.collectAsState()
    val user = uiState.user
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Dashboard",
                    style = MaterialTheme.typography.headlineMedium
                )
                if (user != null) {
                    Text(
                        text = "Welcome, ${user.name ?: user.email}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            TextButton(onClick = onLogout) {
                Text("Logout")
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Role info
        if (user != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Role: ${user.globalRole ?: "Employee"}",
                        style = MaterialTheme.typography.titleMedium
                    )
                    // Company role info would be available from authStore if needed
                }
            }
        }
        
        // Navigation cards
        val menuItems = listOf(
            "Clients" to onNavigateToClients,
            "Projects" to onNavigateToProjects,
            "Tasks" to onNavigateToTasks,
            "Messages" to onNavigateToMessages,
            "Orders" to onNavigateToOrders,
            "Settings" to onNavigateToSettings
        )
        
        menuItems.chunked(2).forEach { rowItems ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                rowItems.forEach { (title, onClick) ->
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .height(120.dp)
                            .clickable(onClick = onClick)
                    ) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = title,
                                style = MaterialTheme.typography.titleLarge
                            )
                        }
                    }
                }
                // Fill empty space if odd number of items
                if (rowItems.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

