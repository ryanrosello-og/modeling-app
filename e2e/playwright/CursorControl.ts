import { Page, TestInfo } from '@playwright/test'

export type MouseMovement = {
  x: number
  y: number
  action: 'click' | 'move'
}

export default class CursorControl {
  private mouseMovements: MouseMovement[] = []
  constructor(private page: Page) {}

  async moveTo(x: number, y: number) {
    // TODO handle step?
    this.mouseMovements.push({ x, y, action: 'move' })
    await this.page.mouse.move(x, y)
  }

  async click(x: number, y: number) {
    this.mouseMovements.push({ x, y, action: 'click' })
    await this.page.mouse.click(x, y)
  }

  add(movement: MouseMovement | MouseMovement[]) {
    if (Array.isArray(movement)) {
      this.mouseMovements.push(...movement)
    } else {
      this.mouseMovements.push(movement)
    }
  }

  reset() {
    this.mouseMovements = []
  }

  async captureMouseMovements(testInfo: TestInfo) {
    await this.page.evaluate((mouseMovements) => {
      for (let mouseMovement of mouseMovements) {
        const { x, y, action } = mouseMovement
        const elementWidth = action === 'move' ? 3 : 5
        let circle = document.createElement('div')
        circle.id = `pw-indicator-x${x}-y${y}`
        circle.style.position = 'absolute'
        circle.style.width = `${elementWidth}px`
        circle.style.height = `${elementWidth}px`
        circle.style.pointerEvents = 'none'

        if (action === 'click') {
          circle.style.backgroundColor = 'green'
          circle.style.transform = 'rotate(45deg)'
          // incase click and move are at the same position, ensure click is shown behind
          circle.style.zIndex = '999'
        } else {
          circle.style.backgroundColor = 'red'
          circle.style.borderRadius = '50%'
          circle.style.zIndex = '1000'
        }

        circle.style.left = `${x - elementWidth / 2}px`
        circle.style.top = `${y - elementWidth / 2}px`
        document.body.appendChild(circle)
      }
    }, this.mouseMovements)

    const screenshot = await this.page.screenshot()
    await testInfo.attach('screenshot', {
      body: screenshot,
      contentType: 'image/png',
    })
    await this.removeIndicators()
  }

  private async removeIndicators() {
    await this.page.evaluate(() => {
      let indicators = document.querySelectorAll('[id*="pw-indicator-"]')
      indicators.forEach((e) => e.remove())
    })
  }
}
