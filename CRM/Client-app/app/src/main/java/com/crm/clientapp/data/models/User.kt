package com.crm.clientapp.data.models

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("_id") val id: String? = null,
    @SerializedName("firebaseUid") val firebaseUid: String,
    @SerializedName("email") val email: String,
    @SerializedName("name") val name: String? = null,
    @SerializedName("globalRole") val globalRole: String? = null,
    @SerializedName("companies") val companies: List<CompanyMembership>? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class CompanyMembership(
    @SerializedName("companyId") val companyId: Company?,
    @SerializedName("role") val role: String,
    @SerializedName("isActive") val isActive: Boolean = true
)

data class Company(
    @SerializedName("_id") val id: String? = null,
    @SerializedName("name") val name: String,
    @SerializedName("domain") val domain: String? = null,
    @SerializedName("companySize") val companySize: String? = null,
    @SerializedName("address") val address: Address? = null,
    @SerializedName("isActive") val isActive: Boolean = true
)

data class Address(
    @SerializedName("street") val street: String? = null,
    @SerializedName("city") val city: String? = null,
    @SerializedName("state") val state: String? = null,
    @SerializedName("zipCode") val zipCode: String? = null,
    @SerializedName("country") val country: String? = null
)

