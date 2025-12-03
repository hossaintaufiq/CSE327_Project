package com.example.crmprime.data.model

import com.google.gson.annotations.SerializedName

data class DashboardStats(
    @SerializedName("role")
    val role: String = "",
    @SerializedName("stats")
    val stats: Stats = Stats(),
    @SerializedName("revenueTrend")
    val revenueTrend: List<RevenueData> = emptyList(),
    @SerializedName("recentActivity")
    val recentActivity: List<ActivityItem> = emptyList(),
    @SerializedName("topDeals")
    val topDeals: List<Deal> = emptyList(),
    @SerializedName("recentOrders")
    val recentOrders: List<Order> = emptyList()
)

data class Stats(
    @SerializedName("monthlyRevenue")
    val monthlyRevenue: Double = 0.0,
    @SerializedName("newLeads30d")
    val newLeads30d: Int = 0,
    @SerializedName("pipelineValue")
    val pipelineValue: Double = 0.0,
    @SerializedName("activeTasks")
    val activeTasks: Int = 0,
    @SerializedName("totalRevenue")
    val totalRevenue: Double = 0.0,
    @SerializedName("avgDealSize")
    val avgDealSize: Double = 0.0,
    @SerializedName("conversionRate")
    val conversionRate: Double = 0.0,
    // Employee stats
    @SerializedName("assignedLeads")
    val assignedLeads: Int = 0,
    @SerializedName("newAssignedLeads30d")
    val newAssignedLeads30d: Int = 0,
    @SerializedName("assignedOrders")
    val assignedOrders: Int = 0,
    @SerializedName("myRevenue")
    val myRevenue: Double = 0.0,
    @SerializedName("assignedTasks")
    val assignedTasks: Int = 0,
    @SerializedName("unreadMessages")
    val unreadMessages: Int = 0,
    // Manager stats
    @SerializedName("teamSize")
    val teamSize: Int = 0,
    @SerializedName("teamLeads")
    val teamLeads: Int = 0,
    @SerializedName("myLeads")
    val myLeads: Int = 0,
    @SerializedName("teamOrders")
    val teamOrders: Int = 0,
    @SerializedName("myOrders")
    val myOrders: Int = 0,
    @SerializedName("teamRevenue")
    val teamRevenue: Double = 0.0,
    @SerializedName("myTasks")
    val myTasks: Int = 0,
    @SerializedName("myActiveTasks")
    val myActiveTasks: Int = 0,
    // Client stats
    @SerializedName("totalOrders")
    val totalOrders: Int = 0,
    @SerializedName("pendingOrders")
    val pendingOrders: Int = 0,
    @SerializedName("completedOrders")
    val completedOrders: Int = 0,
    @SerializedName("totalSpent")
    val totalSpent: Double = 0.0
)

data class RevenueData(
    @SerializedName("month")
    val month: String = "",
    @SerializedName("revenue")
    val revenue: Double = 0.0
)

data class ActivityItem(
    @SerializedName("id")
    val id: String = "",
    @SerializedName("type")
    val type: String = "",
    @SerializedName("activityType")
    val activityType: String = "",
    @SerializedName("employeeName")
    val employeeName: String? = null,
    @SerializedName("date")
    val date: String = "",
    @SerializedName("leadName")
    val leadName: String? = null,
    @SerializedName("orderNumber")
    val orderNumber: String? = null,
    @SerializedName("amount")
    val amount: Double? = null,
    @SerializedName("taskTitle")
    val taskTitle: String? = null,
    @SerializedName("dueDate")
    val dueDate: String? = null,
    @SerializedName("status")
    val status: String? = null,
    @SerializedName("content")
    val content: String? = null
)

data class Deal(
    @SerializedName("id")
    val id: String = "",
    @SerializedName("clientName")
    val clientName: String = "",
    @SerializedName("orderNumber")
    val orderNumber: String = "",
    @SerializedName("amount")
    val amount: Double = 0.0,
    @SerializedName("status")
    val status: String = ""
)

data class Order(
    @SerializedName("id")
    val id: String = "",
    @SerializedName("orderNumber")
    val orderNumber: String = "",
    @SerializedName("totalAmount")
    val totalAmount: Double = 0.0,
    @SerializedName("status")
    val status: String = "",
    @SerializedName("assignedTo")
    val assignedTo: String? = null,
    @SerializedName("createdAt")
    val createdAt: String = ""
)
