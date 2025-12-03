package com.example.crmprime.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.crmprime.data.model.User
import com.example.crmprime.ui.screen.dashboard.AdminDashboardScreen
import com.example.crmprime.ui.screen.dashboard.ClientDashboardScreen
import com.example.crmprime.ui.screen.dashboard.EmployeeDashboardScreen
import com.example.crmprime.ui.screen.dashboard.ManagerDashboardScreen
import com.example.crmprime.ui.screen.dashboard.SuperAdminDashboardScreen
import com.example.crmprime.ui.viewmodel.DashboardViewModel
import com.example.crmprime.ui.viewmodel.SuperAdminViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    user: User,
    companyRole: String?,
    onLogout: () -> Unit,
    viewModel: DashboardViewModel = viewModel(),
    superAdminViewModel: SuperAdminViewModel = viewModel()
) {
    val dashboardState by viewModel.dashboardState.collectAsState()
    val superAdminState by superAdminViewModel.superAdminState.collectAsState()

    val isSuperAdmin = user.globalRole == "super_admin"
    val userName = user.name ?: user.email

    // Determine the current state based on user role
    val isLoading = if (isSuperAdmin) superAdminState.isLoading else dashboardState.isLoading
    val error = if (isSuperAdmin) superAdminState.error else dashboardState.error
    val stats = if (isSuperAdmin) superAdminState.stats else dashboardState.stats

    // Load data when the screen is first displayed
    LaunchedEffect(key1 = user.id) {
        if (isSuperAdmin) {
            superAdminViewModel.loadSuperAdminStats()
        } else {
            viewModel.loadDashboardStats()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isSuperAdmin) "Super Admin Dashboard" else "Dashboard") },
                actions = {
                    TextButton(onClick = onLogout) {
                        Text("Logout")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            when {
                isLoading -> {
                    // Show a loading indicator while data is being fetched
                    CircularProgressIndicator()
                }
                error != null -> {
                    // Show an error message if something went wrong
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = error,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = {
                            // Allow the user to retry
                            if (isSuperAdmin) superAdminViewModel.refresh() else viewModel.refresh()
                        }) {
                            Text("Retry")
                        }
                    }
                }
                stats != null -> {
                    // Display the dashboard content when data is available
                    if (isSuperAdmin) {
                        SuperAdminDashboardScreen(
                            stats = stats,
                            userName = userName
                        )
                    } else {
                        val role = stats.role ?: companyRole ?: "employee"
                        when (role) {
                            "employee" -> EmployeeDashboardScreen(stats = stats, userName = userName)
                            "manager" -> ManagerDashboardScreen(stats = stats, userName = userName)
                            "client" -> ClientDashboardScreen(stats = stats, userName = userName)
                            "company_admin" -> AdminDashboardScreen(stats = stats, userName = userName)
                            else -> AdminDashboardScreen(stats = stats, userName = userName)
                        }
                    }
                }
                else -> {
                    // Fallback to a loader if stats are still null after the initial load
                    CircularProgressIndicator()
                }
            }
        }
    }
}
