import androidx.compose.desktop.ui.tooling.preview.Preview
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import kotlinx.serialization.json.Json
import java.io.File

// 웹 프로젝트의 데이터 경로
val JSON_PATH = "../figma-to-image-ai/scenes.json"

@Composable
fun App() {
    val scenes = remember { loadScenes() }
    var selectedScene by remember { mutableStateOf(scenes.firstOrNull()) }

    MaterialTheme {
        Row(Modifier.fillMaxSize()) {
            // 씬 리스트 사이드바
            LazyColumn(Modifier.width(250.dp).fillMaxHeight()) {
                items(scenes) { scene ->
                    Text(
                        text = scene.scene_no,
                        modifier = Modifier.padding(16.dp).fillMaxWidth()
                            .clickable { selectedScene = scene }
                    )
                    Divider()
                }
            }
            // 상세 뷰어 영역
            Column(Modifier.padding(20.dp)) {
                selectedScene?.let {
                    Text(it.scene_no, style = MaterialTheme.typography.h4)
                    Spacer(Modifier.height(10.dp))
                    Text("묘사: ${it.desc_kr}")
                    Spacer(Modifier.height(10.dp))
                    Text("프롬프트: ${it.prompt_en}")
                }
            }
        }
    }
}

// 데이터 모델
@kotlinx.serialization.Serializable
data class Scene(val scene_no: String, val desc_kr: String, val prompt_en: String)

fun loadScenes(): List<Scene> {
    return try {
        val json = File(JSON_PATH).readText()
        Json.decodeFromString<List<Scene>>(json)
    } catch (e: Exception) {
        listOf(Scene("Error", "데이터 로드 실패", "Check path"))
    }
}

fun main() = application {
    Window(onCloseRequest = ::exitApplication, title = "Harness Scene Viewer") {
        App()
    }
}
