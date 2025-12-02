package com.example.crmprime.util

import java.text.SimpleDateFormat
import java.util.*

fun formatCurrency(amount: Double): String {
    return if (amount >= 1000000) {
        String.format("$%.1fM", amount / 1000000)
    } else if (amount >= 1000) {
        String.format("$%.1fK", amount / 1000)
    } else {
        String.format("$%.0f", amount)
    }
}

fun formatTimeAgo(dateString: String): String {
    return try {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        val date = sdf.parse(dateString) ?: return "N/A"
        
        val now = Date()
        val diff = now.time - date.time
        
        val seconds = diff / 1000
        val minutes = seconds / 60
        val hours = minutes / 60
        val days = hours / 24
        
        when {
            days > 0 -> "${days} day${if (days > 1) "s" else ""} ago"
            hours > 0 -> "${hours} hour${if (hours > 1) "s" else ""} ago"
            minutes > 0 -> "${minutes} minute${if (minutes > 1) "s" else ""} ago"
            else -> "Just now"
        }
    } catch (e: Exception) {
        "N/A"
    }
}

