Beschreibung

Dieses Kommandozeilenskript vereinfacht die Datensicherung mit rsync. Es sichert ausgew�hlte Ordner auf einen Datentr�ger (z.B. USB-Stick, externe Festplatte) und kann dabei rsyncs Algorithmus f�r differenzielle Datensicherungen mittels harter Links nutzen. Dadurch wird zu jedem Sicherungszeitpunkt eine volle Datensicherung erstellt, ohne jedoch f�r unver�nderte Dateien zus�tzlichen Speicherplatz zu belegen. Gleichzeitig bleibt die Ordnerstruktur der Datensicherungen v�llig transparent und kann ohne spezielle Programme nach belieben vollst�ndig oder teilweise wiederhergestellt werden.

===============================================================================

Installation

1. Zun�chst muss rsync f�r Windows heruntergeladen und installiert werden, so dass es im Ausf�hrungspfad des Sicherungsskriptes zu finden ist. Alternativ kann es auch in einem Unterverzeichnis mit Namen 'rsync' im Installationsverzeichnis von jsRsync abgelegt werden.

2. Das Sicherungsskript (jsRsync.js), sowie die Konfigurationsdateien (folders.rsync, optional: exclude.rsync) k�nnen beispielsweise im Wurzelverzeichnis des Datentr�gers abgelegt werden, der f�r die Datensicherung genutzt werden soll.

3. Die Pfade der zu sichernden Ordner m�ssen in folders.rsync eingetragen werden. Das Format ist [Name];[Pfad]. Dabei ist [Name] ein beliebiger Name, welcher w�hrend des Sicherungsprozesses zur besseren Verst�ndlichkeit angezeigt wird. [Pfad] ist der Pfad des Ordners.

4. Falls gew�nscht k�nnen in exclude.rsync Filterregeln zum Ausschluss von bestimmten Dateien und Ordnern angegeben werden. Ordnerspezifische Filter k�nnen unter filter.rsync im jeweiligen Ordner des Ursprungsdatentr�gers hinterlegt werden. Die Syntax dieser Dateien ist in der Dokumentation von rsync erkl�rt.

===============================================================================

Benutzung

1. Sicherungsdatentr�ger anschlie�en.

2. Sicherungsskript (jsRsync.js) ausf�hren.

3. F�r eine differenzielle Datensicherung muss der Name des Ordners der Referenzsicherung angegeben werden. Dies ist meist der Ordner der letzten Datensicherung und muss auf dem selben Datentr�ger liegen wir die neu anzulegende Sicherung.
Wird kein Referenzordner angegeben, so wird eine komplette Datensicherung erstellt und auch f�r unver�nderte Dateien eine neue Kopie angelegt.

4. F�r den Speicherort der Datensicherung kann ein beliebiger Ordnername angegeben werden. Dieser wird im Wurzelverzeichnis des Sicherungsdatentr�gers angelegt.
Falls kein Ordnername angegeben wird, so wird er automatisch aus dem aktuellen Datum im Format JJJJ-MM-TT generiert.

5. Vor dem Start der Datensicherung wird eine Zusammenfassung der auszuf�hrenden Aktionen angezeigt und die Best�tigung des Nutzers abgewartet. Bis zu diesem Zeitpunkt werden keine Dateien angelegt, ver�ndert oder gel�scht und der Vorgang kann ohne Auswirkungen abgebrochen werden.

HINWEIS: Der Name des Referenzordners sowie der des Sicherungsordners k�nnen auch beim Aufruf des Skripts als erster, beziehungsweise zweiter Parameter �bergeben werden.

HINWEIS: rsync erstellt f�r jeden Ordner in folders.rsync eine Logdatei im aktuellen Sicherungsordner.

===============================================================================

Dieses Skript ist als einfache, ma�geschneiderte L�sung f�r einige sehr spezielle Anwendungsf�lle konzipiert worden. Wer ein sch�neres und/oder m�chtigeres Programm sucht, darf gerne von hier aus weitermachen oder sich gleich eines der vielen verf�gbaren Programme im Internet bedienen.