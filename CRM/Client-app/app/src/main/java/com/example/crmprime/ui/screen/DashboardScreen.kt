package com.example.crmprime.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.crmprime.data.model.User
import com.example.crmprime.ui.screen.dashboard.*
import com.example.crmprime.ui.viewmodel.DashboardViewModel

@Composable
fun DashboardScreen(
    user: User,
    companyRole: String?,
    onLogout: () -> Unit,
    viewModel: DashboardViewModel = viewModel()
) {
    val dashboardState by viewModel.dashboardState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadDashboardStats()
    }
    
    val role = dashboardState.stats?.role ?: companyRole ?: "employee"
    val userName = user.name ?: user.email
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Dashboard") },
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
                .padding(paddingValues)
        ) {
            when {
                dashboardState.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                dashboardState.error != null -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = dashboardState.error!!,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.refresh() }) {
                            Text("Retry")
                        }
                    }
                }
                else -> {
                    when (role) {
                        "employee" -> {
                            EmployeeDashboardScreen(
                                stats = dashboardState.stats,
                                userName = userName
                            )
                        }
                        "manager" -> {
                            ManagerDashboardScreen(
                                stats = dashboardState.stats,
                                userName = userName
                            )
                        }
                        "client" -> {
                            ClientDashboardScreen(
                                stats = dashboardState.stats,
                                userName = userName
                            )
                        }
                        "company_admin" -> {
                            AdminDashboardScreen(
                                stats = dashboardState.stats,
                                userName = userName
                            )
                        }
                        else -> {
                            AdminDashboardScreen(
                                stats = dashboardState.stats,
                                userName = userName
                            )
                        }
                    }
                }
            }
        }
    }
}

