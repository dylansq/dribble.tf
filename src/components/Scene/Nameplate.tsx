import React from 'react'
import { clamp } from 'lodash'

import { ClassIcon } from '@components/UI/ClassIcon'

import { ACTOR_TEAM_COLORS } from '@constants/mappings'
import { parseClassHealth } from '@utils/players'

export interface NameplateProps {
  health: number
  classId: number
  name: string
  team: string
  settings: Object | any
}

export const Nameplate = (props: NameplateProps) => {
  const { health, classId, name, team, settings } = props

  const healthColor = ACTOR_TEAM_COLORS(team).healthBar
  const { percentage } = parseClassHealth(classId, health)

  if (!settings.enabled) return null

  return (
    <>
      <div className="nameplate">
        {settings.showName && <div className="name">{name}</div>}

        {settings.showHealth && (
          <div className="healthbar">
            {/* Note: fill & overheal widths are manipulated inline for better performance,
            because changing the value in css class directly will continously trigger
            styled-jsx recalculation / DOM reflow (very costly over time)
            https://github.com/vercel/styled-jsx#via-inline-style */}
            <div className="fill" style={{ width: `${percentage}%` }} />
            <div className="overheal" style={{ width: `${clamp(percentage - 100, 0, 100)}%` }} />
          </div>
        )}

        {settings.showClass && (
          <div className="class">
            <ClassIcon classId={classId} size={16} />
          </div>
        )}
      </div>

      <style jsx>{`
        .nameplate {
          display: flex;
          flex-flow: column nowrap;
          align-items: center;
          text-align: center;
          pointer-events: none;
          user-select: none;
          bottom: 0;

          .name {
            font-size: 0.9rem;
            line-height: 0.9rem;
            font-weight: 700;
            white-space: nowrap;
            max-width: 10rem;
            padding: 0 0.1rem;
            text-overflow: ellipsis;
            overflow: hidden;
            color: #ffffff;
            text-shadow: 0 0 2px #000000, 0 0 2px #000000, 0 0 2px #000000, 0 0 2px #000000;
          }

          .healthbar {
            position: relative;
            width: 80px;
            height: 6px;
            background-color: #8f7b89;
            overflow: hidden;
            margin-bottom: 0.3rem;

            .fill {
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              background-color: ${healthColor};
            }

            .overheal {
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              background-color: #eeeeee;
            }
          }

          .class {
            border-radius: 50%;
            background-color: ${healthColor};
            border: 3px solid rgba(0, 0, 0, 0.2);
          }
        }
      `}</style>
    </>
  )
}
