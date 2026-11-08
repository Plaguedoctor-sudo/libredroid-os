import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

ApplicationWindow {
    id: root
    visible: true
    width: 1280
    height: 800
    color: "#0a0e14"
    flags: Qt.FramelessWindowHint | Qt.WindowStaysOnBottomHint

    property string activeDomain: "VAULT"
    property int batteryPct: 88
    property bool isCharging: false
    property string timeString: "12:00"

    // Top Status Bar
    Rectangle {
        id: statusBar
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: 36
        color: "#0d1117"

        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 16
            anchors.rightMargin: 16

            Text {
                text: root.timeString
                color: "#e6edf3"
                font.bold: true
                font.pixelSize: 13
            }

            Rectangle {
                width: 72
                height: 20
                radius: 10
                color: root.activeDomain === "VAULT" ? "#7928ca" : "#2563eb"
                Text {
                    anchors.centerIn: parent
                    text: root.activeDomain
                    color: "white"
                    font.pixelSize: 10
                    font.bold: true
                }
            }

            Item { Layout.fillWidth: true }

            Text {
                text: "📶 LibreDroid-Mesh"
                color: "#8b949e"
                font.pixelSize: 12
            }

            Text {
                text: (root.isCharging ? "⚡ " : "🔋 ") + root.batteryPct + "%"
                color: root.batteryPct < 20 ? "#ef4444" : "#10b981"
                font.pixelSize: 12
            }
        }
    }

    // Subsurface Wayland App Container Area
    Rectangle {
        id: subsurfaceArea
        anchors.top: statusBar.bottom
        anchors.bottom: taskbar.top
        anchors.left: parent.left
        anchors.right: parent.right
        color: "transparent"

        Text {
            anchors.centerIn: parent
            text: "Native Wayland Subsurface Viewport (Zero-Copy DRI3/DMABUF)"
            color: "#30363d"
            font.pixelSize: 16
        }
    }

    // Bottom Convergent Taskbar
    Rectangle {
        id: taskbar
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        height: 52
        color: "#0d1117"

        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 12
            anchors.rightMargin: 12

            Button {
                text: "⌘"
                onClicked: launcherPopup.open()
            }

            Item { Layout.fillWidth: true }

            Row {
                spacing: 16
                Button { text: "◀" }
                Button { text: "●" }
                Button { text: "■" }
            }
        }
    }

    Popup {
        id: launcherPopup
        anchors.centerIn: parent
        width: 600
        height: 400
        modal: true
        focus: true

        GridView {
            anchors.fill: parent
            cellWidth: 100
            cellHeight: 100
            model: ListModel {
                ListElement { name: "Vault"; icon: "🔐"; domain: "vault" }
                ListElement { name: "F-Droid"; icon: "📦"; domain: "personal" }
                ListElement { name: "Terminal"; icon: "💻"; domain: "work" }
                ListElement { name: "Waydroid"; icon: "🤖"; domain: "android" }
            }
            delegate: Item {
                width: 90; height: 90
                Column {
                    anchors.centerIn: parent
                    Text { text: model.icon; font.pixelSize: 32; anchors.horizontalCenter: parent.horizontalCenter }
                    Text { text: model.name; color: "white"; anchors.horizontalCenter: parent.horizontalCenter }
                }
            }
        }
    }
}
