package com.hossaintaufiq.crmprime

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.hossaintaufiq.crmprime.ui.navigation.NavGraph
import com.hossaintaufiq.crmprime.ui.theme.CRMClientAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        try {
            Log.d("MainActivity", "onCreate: Starting app initialization")
            
            setContent {
                CRMClientAppTheme {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        val navController = rememberNavController()
                        NavGraph(navController = navController)
                    }
                }
            }
            
            Log.d("MainActivity", "onCreate: Content set successfully")
        } catch (e: Exception) {
            Log.e("MainActivity", "onCreate: Error", e)
            e.printStackTrace()
        }
    }
}

