import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Model.js" as Model

// Cards, today's scene and what is due. Data comes from files in
// ~/.local/state/swedish: the cards exported with the app build and the
// progress the scene window saves through the local server.
Panel {
  id: root
  moduleName: "gread.swedish"
  ipcTarget: "gread.swedish"
  manageIpc: true

  property var anchorItem: null
  property var hostWidget: null
  readonly property var barIdentity: hostWidget || root

  readonly property string script: Qt.resolvedUrl("bin/swedish").toString().replace(/^file:\/\//, "")
  readonly property string stateDir: (Quickshell.env("XDG_STATE_HOME") || Quickshell.env("HOME") + "/.local/state") + "/swedish"
  // A link to the repo's dist/cards.json (bin/swedish install): the plugin is
  // itself a link into the repo, so a relative path would not lead there.
  readonly property string cardsPath: root.stateDir + "/cards.json"

  readonly property color fg: root.bar ? root.bar.foreground : Color.foreground
  readonly property color dim: Qt.alpha(root.fg, 0.55)
  readonly property string fontFamily: root.bar ? root.bar.fontFamily : Style.font.family
  readonly property real innerWidth: Math.max(Style.space(240), keyCatcher.width - Style.space(4))
  readonly property real gap: Style.space(6)

  property var cards: []
  property var labels: ({ temas: {}, niveis: {} })
  // Decks switched off (Model.parseDecks), saved in decks.json.
  property var off: ({ lote: [], tema: [], nivel: [] })
  property bool showDecks: false
  readonly property var active: Model.activeCards(root.cards, root.off)
  property var progress: ({})
  property var days: []
  // Re-evaluated every minute so "today" rolls over at midnight.
  property real now: Date.now()

  property string filter: "all"
  property string query: ""

  readonly property var sceneOfTheDay: Model.sceneOfTheDay(root.active, root.progress)
  readonly property var stats: Model.counts(root.active, root.progress, root.now)
  readonly property bool doneToday: Model.practisedToday(root.progress, root.now)
  readonly property int streak: Model.streak(root.days, root.now)
  readonly property var shown: Model.visibleCards(root.active, root.progress, root.filter, root.query, root.now)

  readonly property string tooltip: root.cards.length === 0 ? "Svenska"
    : "Svenska · " + (root.doneToday ? "feito hoje ✓" : "nenhuma carta hoje")
      + (root.stats.due > 0 ? " · " + root.stats.due + " para revisar" : "")

  FileView {
    path: root.cardsPath
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: {
      root.cards = Model.parseCards(text())
      root.labels = Model.parseLabels(text())
    }
  }

  FileView {
    id: decksFile
    path: root.stateDir + "/decks.json"
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: root.off = Model.parseDecks(text())
  }

  function toggleDeck(kind, value) {
    root.off = Model.toggled(root.off, kind, value)
    decksFile.setText(JSON.stringify({ off: root.off }))
  }

  function allDecks() {
    root.off = { lote: [], tema: [], nivel: [] }
    decksFile.setText(JSON.stringify({ off: root.off }))
  }

  FileView {
    path: root.stateDir + "/progress.json"
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: root.progress = Model.parseProgress(text())
    onLoadFailed: root.progress = ({})
  }

  FileView {
    path: root.stateDir + "/activity.json"
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: root.days = Model.parseDays(text())
    onLoadFailed: root.days = []
  }

  Timer {
    interval: 60000
    repeat: true
    running: true
    onTriggered: root.now = Date.now()
  }

  function open() {
    root.now = Date.now()
    list.currentIndex = root.shown.length > 0 ? 0 : -1
    root.controller.show()
    Qt.callLater(function() { search.forceActiveFocus() })
  }

  function close() {
    root.controller.hide()
  }

  function toggle() {
    if (root.opened) root.close()
    else root.open()
  }

  function switchPanel(direction) {
    if (root.bar && typeof root.bar.switchPanelFrom === "function")
      return root.bar.switchPanelFrom(root.barIdentity, direction)
    return false
  }

  // The scene window opens docked under the bar; the panel steps aside.
  function openScene(mode, ids) {
    if (!ids) return
    launcher.command = ["setsid", "-f", "bash", root.script, "open", mode, ids]
    launcher.running = true
    root.close()
  }

  function openCard(entry) {
    if (!entry) return
    if (entry.built) root.openScene("review", entry.card.id)
    else root.openScene("build", entry.card.id)
  }

  function statusGlyph(status) {
    return status === "new" ? "○" : status === "learned" ? "●" : "◐"
  }

  function statusText(entry) {
    if (entry.status === "new") return "nova"
    if (entry.status === "learned") return "aprendida"
    if (entry.status === "due") return "revisar"
    return "imagem " + Math.round(entry.level / Model.MAX_LEVEL * 100) + "%"
  }

  Process { id: launcher }

  KeyboardPanel {
    id: panel
    anchorItem: root.anchorItem
    owner: root.barIdentity
    bar: root.bar
    open: root.opened
    focusTarget: search
    contentWidth: panel.fittedContentWidth(Style.space(440))
    contentHeight: panel.fittedContentHeight(content.implicitHeight)

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }
      onMoveRequested: function(dx, dy) {
        if (dy === 0 || root.shown.length === 0) return
        list.currentIndex = Math.max(0, Math.min(root.shown.length - 1, list.currentIndex + dy))
      }
      onActivateRequested: root.openCard(root.shown[list.currentIndex])

      Column {
        id: content
        width: parent.width
        spacing: Style.space(10)
        topPadding: Style.space(4)
        bottomPadding: Style.space(4)

        // ---- Header
        Column {
          width: root.innerWidth
          spacing: Style.space(2)

          Row {
            spacing: Style.space(8)
            Text {
              id: title
              text: "Svenska 🇸🇪"
              color: root.fg
              font.family: root.fontFamily
              font.pixelSize: Style.font.title
              font.bold: true
            }
            Text {
              anchors.baseline: title.baseline
              text: "by Gread"
              color: Qt.darker(root.fg, 1.4)
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
            }
          }

          Text {
            width: parent.width
            text: root.cards.length === 0
              ? "Nenhuma carta encontrada. Rode: swedish build"
              : (root.doneToday ? "✓ Você já praticou hoje" : "Nenhuma carta hoje ainda")
                + (root.streak > 0 ? "  ·  🔥 " + root.streak + (root.streak === 1 ? " dia" : " dias") : "")
                + "  ·  " + root.stats.learned + "/" + root.stats.total + " aprendidas"
            color: root.doneToday ? root.fg : Color.accent
            font.family: root.fontFamily
            font.pixelSize: Style.font.bodySmall
            elide: Text.ElideRight
          }
        }

        // ---- Today's scene
        Rectangle {
          visible: root.cards.length > 0
          width: root.innerWidth
          height: today.implicitHeight + Style.space(20)
          radius: Style.cornerRadius
          color: Qt.alpha(root.fg, 0.05)
          border.width: 1
          border.color: Qt.alpha(root.fg, 0.15)

          Column {
            id: today
            anchors.fill: parent
            anchors.margins: Style.space(10)
            spacing: Style.space(6)

            Text {
              text: root.sceneOfTheDay
                ? "CENA DO DIA · " + (root.labels.temas[root.sceneOfTheDay.tema] || "") + " · " + (root.labels.niveis[root.sceneOfTheDay.nivel] || "")
                : root.active.length === 0 ? "NENHUMA CARTA ATIVA" : "TODAS AS CENAS DESTES DECKS MONTADAS 🎉"
              color: root.dim
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              width: parent.width
              elide: Text.ElideRight
            }

            Text {
              visible: root.sceneOfTheDay !== null
              width: parent.width
              text: root.sceneOfTheDay ? root.sceneOfTheDay.fraseFonte : ""
              color: root.fg
              font.family: root.fontFamily
              font.pixelSize: Style.font.subtitle
              font.bold: true
              wrapMode: Text.WordWrap
            }

            Row {
              spacing: root.gap
              Btn {
                width: (today.width - root.gap) / 2
                icon: "󰐊"
                label: "Assistir cena"
                primary: true
                available: root.sceneOfTheDay !== null
                onClicked: root.openScene("build", root.sceneOfTheDay.id)
              }
              Btn {
                width: (today.width - root.gap) / 2
                icon: "󰑓"
                label: root.stats.due > 0 ? "Revisar (" + root.stats.due + ")" : "Nada para revisar"
                available: root.stats.due > 0
                onClicked: root.openScene("review", Model.dueIds(root.active, root.progress, root.now))
              }
            }
          }
        }

        // ---- Decks: which cards are in play
        Btn {
          visible: root.cards.length > 0
          width: root.innerWidth
          icon: root.showDecks ? "󰅖" : "󰉋"
          label: root.showDecks ? "Fechar decks"
            : "Decks · " + root.active.length + " de " + root.cards.length + " cartas ativas"
          active: root.showDecks
          onClicked: root.showDecks = !root.showDecks
        }

        Column {
          visible: root.showDecks && root.cards.length > 0
          width: root.innerWidth
          spacing: Style.space(8)

          Repeater {
            model: [
              { kind: "nivel", title: "NÍVEL" },
              { kind: "lote", title: "LOTE" },
              { kind: "tema", title: "TEMA" }
            ]

            Column {
              id: group
              required property var modelData
              width: root.innerWidth
              spacing: Style.space(4)

              Text {
                text: group.modelData.title
                color: root.dim
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
              }

              Flow {
                width: root.innerWidth
                spacing: Style.space(4)

                Repeater {
                  model: Model.deckList(root.cards, group.modelData.kind,
                    group.modelData.kind === "tema" ? root.labels.temas
                    : group.modelData.kind === "nivel" ? root.labels.niveis : null)

                  Btn {
                    required property var modelData
                    width: deckLabel.advanceWidth + Style.space(18)
                    height: Style.space(28)
                    label: modelData.label + " · " + modelData.count
                    active: root.off[modelData.kind].indexOf(modelData.value) === -1
                    onClicked: root.toggleDeck(modelData.kind, modelData.value)

                    TextMetrics {
                      id: deckLabel
                      font.family: root.fontFamily
                      font.pixelSize: Style.font.bodySmall
                      text: modelData.label + " · " + modelData.count
                    }
                  }
                }
              }
            }
          }

          Row {
            spacing: root.gap
            Btn {
              width: (root.innerWidth - root.gap) / 2
              icon: "󰒆"
              label: "Ativar todos"
              onClicked: root.allDecks()
            }
            Text {
              width: (root.innerWidth - root.gap) / 2
              anchors.verticalCenter: parent.verticalCenter
              text: root.active.length === 0 ? "Nenhuma carta: ligue algum deck."
                : "Uma carta entra se o nível, o lote e o tema dela estiverem ligados."
              color: root.active.length === 0 ? Color.urgent : root.dim
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              wrapMode: Text.WordWrap
            }
          }
        }

        // ---- Search and filters
        TextField {
          id: search
          visible: root.cards.length > 0 && !root.showDecks
          width: root.innerWidth
          placeholderText: "Buscar em português ou sueco…"
          foreground: root.fg
          font.family: root.fontFamily
          font.pixelSize: Style.font.bodySmall
          onTextChanged: {
            root.query = text
            list.currentIndex = 0
          }
          onAccepted: root.openCard(root.shown[list.currentIndex])
        }

        Row {
          visible: root.cards.length > 0 && !root.showDecks
          spacing: root.gap
          Repeater {
            model: [
              { key: "all", label: "Todas" },
              { key: "new", label: "Novas" },
              { key: "review", label: "Revisar" },
              { key: "learned", label: "Aprendidas" }
            ]
            Btn {
              required property var modelData
              width: (root.innerWidth - 3 * root.gap) / 4
              label: modelData.label
              active: root.filter === modelData.key
              onClicked: {
                root.filter = modelData.key
                list.currentIndex = 0
              }
            }
          }
        }

        // ---- Cards
        ListView {
          id: list
          visible: root.cards.length > 0 && !root.showDecks
          width: root.innerWidth
          height: Math.min(Math.max(contentHeight, Style.space(40)), Style.space(380))
          clip: true
          model: root.shown
          spacing: Style.space(2)
          boundsBehavior: Flickable.StopAtBounds
          highlightMoveDuration: 0

          delegate: Rectangle {
            id: row
            required property var modelData
            required property int index
            readonly property bool selected: ListView.isCurrentItem

            width: list.width
            height: rowContent.implicitHeight + Style.space(12)
            radius: Style.cornerRadius
            color: selected ? Qt.alpha(Color.accent, 0.16) : (rowArea.containsMouse ? Qt.alpha(root.fg, 0.07) : "transparent")

            Row {
              id: rowContent
              anchors.verticalCenter: parent.verticalCenter
              anchors.left: parent.left
              anchors.right: parent.right
              anchors.leftMargin: Style.space(8)
              anchors.rightMargin: Style.space(8)
              spacing: Style.space(8)

              Text {
                id: glyph
                anchors.verticalCenter: parent.verticalCenter
                text: root.statusGlyph(row.modelData.status)
                color: row.modelData.status === "new" ? root.dim : Color.accent
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
              }

              Column {
                width: parent.width - glyph.width - badge.width - 2 * parent.spacing
                anchors.verticalCenter: parent.verticalCenter
                spacing: 1

                Text {
                  width: parent.width
                  text: row.modelData.card.fraseFonte
                  color: root.fg
                  font.family: root.fontFamily
                  font.pixelSize: Style.font.bodySmall
                  elide: Text.ElideRight
                }

                Text {
                  visible: row.modelData.built
                  width: parent.width
                  text: row.modelData.card.fraseAlvo
                  color: Color.accent
                  font.family: root.fontFamily
                  font.pixelSize: Style.font.caption
                  elide: Text.ElideRight
                }
              }

              Text {
                id: badge
                anchors.verticalCenter: parent.verticalCenter
                text: root.statusText(row.modelData)
                color: root.dim
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
              }
            }

            MouseArea {
              id: rowArea
              anchors.fill: parent
              hoverEnabled: true
              cursorShape: Qt.PointingHandCursor
              onClicked: {
                list.currentIndex = row.index
                root.openCard(row.modelData)
              }
            }
          }
        }

        Text {
          visible: root.cards.length > 0 && !root.showDecks
          width: root.innerWidth
          text: root.shown.length === 0 ? "Nenhuma carta neste filtro."
            : "↑↓ escolhe · Enter abre · Esc fecha · cartas novas montam a cena, as outras abrem a revisão"
          color: root.dim
          font.family: root.fontFamily
          font.pixelSize: Style.font.caption
          wrapMode: Text.WordWrap
        }
      }
    }
  }

  component Btn: Rectangle {
    id: btn
    property string label: ""
    property string icon: ""
    property bool active: false
    property bool primary: false
    property bool available: true
    signal clicked()

    height: Style.space(32)
    radius: Style.cornerRadius
    color: btn.primary && btn.available ? Color.accent
      : btn.active ? Style.hoverFillFor(root.fg, Color.accent)
      : (area.containsMouse && btn.available ? Qt.alpha(root.fg, 0.10) : "transparent")
    border.width: 1
    border.color: btn.primary || btn.active ? Color.accent : Qt.alpha(root.fg, 0.18)
    opacity: btn.available ? 1 : 0.4

    Row {
      anchors.centerIn: parent
      spacing: Style.space(6)
      width: Math.min(implicitWidth, btn.width - Style.space(8))
      clip: true

      Text {
        visible: btn.icon !== ""
        text: btn.icon
        color: btn.primary && btn.available ? Color.background : root.fg
        font.family: root.fontFamily
        font.pixelSize: Style.font.subtitle
        anchors.verticalCenter: parent.verticalCenter
      }

      Text {
        text: btn.label
        color: btn.primary && btn.available ? Color.background
          : btn.active ? Style.hoverStateColor(root.fg, Color.accent) : root.fg
        font.family: root.fontFamily
        font.pixelSize: Style.font.bodySmall
        elide: Text.ElideRight
        anchors.verticalCenter: parent.verticalCenter
      }
    }

    MouseArea {
      id: area
      anchors.fill: parent
      hoverEnabled: true
      enabled: btn.available
      cursorShape: enabled ? Qt.PointingHandCursor : Qt.ArrowCursor
      onClicked: btn.clicked()
    }
  }
}
