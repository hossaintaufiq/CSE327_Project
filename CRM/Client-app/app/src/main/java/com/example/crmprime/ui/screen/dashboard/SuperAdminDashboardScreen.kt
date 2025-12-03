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
import com.example.crmprime.data.model.SuperAdminStats
import com.example.crmprime.ui.components.ActivityCard
import com.example.crmprime.ui.components.StatCard
import com.example.crmprime.util.formatCurrency

@Composable
fun SuperAdminDashboardScreen(
    stats: SuperAdminStats?,
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
                    text = "Super Admin Dashboard",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Platform-wide management and analytics",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Welcome, $userName",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        // Top KPI Cards
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "Total Companies",
                    value = "${statsData?.totalCompanies ?: 0}",
                    subtitle = "${statsData?.inactiveCompanies ?: 0} inactive",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Total Users",
                    value = "${statsData?.totalUsers ?: 0}",
                    subtitle = "${statsData?.activeUsers ?: 0} active",
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
                    title = "Total Revenue",
                    value = formatCurrency(statsData?.totalRevenue ?: 0.0),
                    subtitle = formatCurrency(statsData?.monthlyRevenue ?: 0.0) + " this month",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Subscriptions",
                    value = "${statsData?.activeSubscriptions ?: 0}",
                    subtitle = "${statsData?.totalSubscriptions ?: 0} total",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Revenue Trend Section
        val revenueTrend = stats?.revenueTrend
        if (!revenueTrend.isNullOrEmpty()) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "Revenue Trend",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        // Simple bar chart representation
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            val maxRevenue = revenueTrend.maxOfOrNull { it.revenue } ?: 1.0
                            revenueTrend.forEach { data ->
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    val height = (data.revenue / maxRevenue * 150).toInt().coerceAtLeast(10)
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth(0.8f)
                                            .height(height.dp)
                                            .padding(horizontal = 4.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Surface(
                                            modifier = Modifier.fillMaxSize(),
                                            color = MaterialTheme.colorScheme.primary,
                                            shape = MaterialTheme.shapes.small
                                        ) {}
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = data.month.take(3),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = formatCurrency(data.revenue),
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Top Companies Section
        val topCompanies = stats?.topCompanies
        if (!topCompanies.isNullOrEmpty()) {
            item {
                Text(
                    text = "Top Companies",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            items(topCompanies) { company ->
                TopCompanyCard(company = company)
            }
        }

        // Daily Signups Section
        val dailySignups = stats?.dailySignups
        if (!dailySignups.isNullOrEmpty()) {
            item {
                Text(
                    text = "Daily Signups",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        val last7Signups = dailySignups.takeLast(7)
                        last7Signups.forEachIndexed { index, signup ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = signup.date,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                Text(
                                    text = "${signup.count} users",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            if (index < last7Signups.size - 1) {
                                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                            }
                        }
                    }
                }
            }
        }

        // Recent Activity Section
        item {
            Text(
                text = "Recent Activity",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 8.dp)
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


@Composable
fun TopCompanyCard(company: com.example.crmprime.data.model.TopCompany) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = company.companyName,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${company.userCount} users",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
                if (!company.isActive) {
                    Text(
                        text = "Inactive",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = formatCurrency(company.revenue),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}
