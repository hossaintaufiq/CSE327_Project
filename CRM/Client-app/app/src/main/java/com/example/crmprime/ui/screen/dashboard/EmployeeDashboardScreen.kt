package com.example.crmprime.ui.screen.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.crmprime.data.model.DashboardStats
import com.example.crmprime.ui.components.ActivityCard
import com.example.crmprime.ui.components.StatCard
import com.example.crmprime.util.formatCurrency

@Composable
fun EmployeeDashboardScreen(
    stats: DashboardStats?,
    userName: String
) {
    val statsData = stats?.stats
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "My Dashboard",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Welcome back, $userName",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "My Leads",
                    value = "${statsData?.assignedLeads ?: 0}",
                    subtitle = "${statsData?.newAssignedLeads30d ?: 0} new (30d)",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "My Orders",
                    value = "${statsData?.assignedOrders ?: 0}",
                    subtitle = formatCurrency(statsData?.myRevenue ?: 0.0),
                    modifier = Modifier.weight(1f)
                )
            }
        }
        
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "My Tasks",
                    value = "${statsData?.assignedTasks ?: 0}",
                    subtitle = "${statsData?.activeTasks ?: 0} active",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Unread Messages",
                    value = "${statsData?.unreadMessages ?: 0}",
                    modifier = Modifier.weight(1f)
                )
            }
        }
        
        item {
            Text(
                text = "Recent Activity",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
        
        if (stats?.recentActivity?.isEmpty() == true) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No recent activities",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            items(stats?.recentActivity ?: emptyList()) { activity ->
                ActivityCard(activity = activity)
            }
        }
    }
}


