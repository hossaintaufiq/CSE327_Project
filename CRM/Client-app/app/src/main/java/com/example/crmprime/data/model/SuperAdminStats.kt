package com.example.crmprime.data.model

import com.google.gson.annotations.SerializedName

data class SuperAdminStats(
    @SerializedName("stats")
    val stats: SuperAdminStatsData? = null,
    @SerializedName("revenueTrend")
    val revenueTrend: List<RevenueData> = emptyList(),
    @SerializedName("recentActivity")
    val recentActivity: List<ActivityItem> = emptyList(),
    @SerializedName("topCompanies")
    val topCompanies: List<TopCompany> = emptyList(),
    @SerializedName("dailySignups")
    val dailySignups: List<DailySignup> = emptyList()
)

data class SuperAdminStatsData(
    @SerializedName("totalCompanies")
    val totalCompanies: Int = 0,
    @SerializedName("inactiveCompanies")
    val inactiveCompanies: Int = 0,
    @SerializedName("totalUsers")
    val totalUsers: Int = 0,
    @SerializedName("activeUsers")
    val activeUsers: Int = 0,
    @SerializedName("totalRevenue")
    val totalRevenue: Double = 0.0,
    @SerializedName("monthlyRevenue")
    val monthlyRevenue: Double = 0.0,
    @SerializedName("activeSubscriptions")
    val activeSubscriptions: Int = 0,
    @SerializedName("totalSubscriptions")
    val totalSubscriptions: Int = 0
)

data class TopCompany(
    @SerializedName("companyId")
    val companyId: String,
    @SerializedName("companyName")
    val companyName: String,
    @SerializedName("revenue")
    val revenue: Double = 0.0,
    @SerializedName("userCount")
    val userCount: Int = 0,
    @SerializedName("isActive")
    val isActive: Boolean = true
)

data class DailySignup(
    @SerializedName("date")
    val date: String,
    @SerializedName("count")
    val count: Int = 0
)

