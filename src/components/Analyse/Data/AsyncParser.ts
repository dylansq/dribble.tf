import { Demo, Header, Player, Match, World } from '@bryjch/demo.js/build'

import { PlayerCache, CachedPlayer } from './PlayerCache'
import { BuildingCache, CachedBuilding } from './BuildingCache'
import { ProjectileCache, CachedProjectile } from './ProjectileCache'
import { Round } from './Types'

export interface CachedDeath {
  tick: number
  victim: Player
  assister: Player | null
  killer: Player | null
  weapon: string
  victimTeam: number
  assisterTeam: number
  killerTeam: number
}

export interface CachedDemo {
  header: Header
  playerCache: PlayerCache
  ticks: number
  deaths: { [tick: string]: CachedDeath[] }
  rounds: Round[]
  buildingCache: BuildingCache
  projectileCache: ProjectileCache
  intervalPerTick: number
  world: World
  nextMappedPlayer: number
  entityPlayerMap: Map<number, Player>
  now: number
}

export class AsyncParser {
  buffer: ArrayBuffer
  demo: Demo
  header: Header
  playerCache: PlayerCache
  nextMappedPlayer = 0
  entityPlayerMap: Map<number, Player> = new Map()
  ticks: number
  match: Match
  deaths: { [tick: string]: CachedDeath[] } = {}
  rounds: Round[]
  buildingCache: BuildingCache
  projectileCache: ProjectileCache
  intervalPerTick: number
  world: World
  progressCallback: (progress: number) => void

  constructor(buffer: ArrayBuffer, progressCallback: (progress: number) => void) {
    this.buffer = buffer
    this.progressCallback = progressCallback
  }

  cache(): Promise<void> {
    return this.getCachedData().then((cachedData: CachedDemo) => {
      this.ticks = cachedData.ticks
      this.header = cachedData.header
      this.playerCache = cachedData.playerCache
      this.buildingCache = cachedData.buildingCache
      this.projectileCache = cachedData.projectileCache
      this.deaths = cachedData.deaths
      this.rounds = cachedData.rounds
      this.intervalPerTick = cachedData.intervalPerTick
      this.world = cachedData.world
      this.nextMappedPlayer = cachedData.nextMappedPlayer
      this.entityPlayerMap = cachedData.entityPlayerMap
    })
  }

  getCachedData(): Promise<CachedDemo> {
    return new Promise((resolve, reject) => {
      /* eslint import/no-webpack-loader-syntax: off */
      const Worker = require('worker-loader!./ParseWorker')
      const worker = new Worker()
      worker.postMessage(
        {
          buffer: this.buffer,
        },
        [this.buffer]
      )
      worker.onmessage = (event: MessageEvent) => {
        if (event.data.error) {
          reject(event.data.error)
          return
        }
        if (event.data.progress) {
          this.progressCallback(event.data.progress)
          return
        }
        const cachedData: CachedDemo = event.data
        PlayerCache.rehydrate(cachedData.playerCache)
        BuildingCache.rehydrate(cachedData.buildingCache)
        ProjectileCache.rehydrate(cachedData.projectileCache)
        resolve(event.data)
      }
    })
  }

  getPlayersAtTick(tick: number) {
    const players: CachedPlayer[] = []
    for (let i = 0; i < this.nextMappedPlayer; i++) {
      let entity = this.entityPlayerMap.get(i)
      if (entity) {
        players.push(this.playerCache.getPlayer(tick, i, entity.user))
      }
    }

    // fake teams in 1v1 ffa
    if (players.length === 2 && players[0].teamId === 0 && players[0].teamId === 0) {
      players[0].teamId = 2
      players[0].team = 'red'
      players[1].teamId = 3
      players[1].team = 'blue'
    }
    return players
  }

  getBuildingAtTick(tick: number): CachedBuilding[] {
    return this.buildingCache.getBuildings(tick)
  }

  getProjectilesAtTick(tick: number): CachedProjectile[] {
    return this.projectileCache.getProjectiles(tick)
  }
}
