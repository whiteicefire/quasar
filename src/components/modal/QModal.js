import EscapeKey from '../../utils/escape-key'
import extend from '../../utils/extend'
import ModelToggleMixin from '../../mixins/model-toggle'
import { QTransition } from '../transition'
import { getScrollbarWidth } from '../../utils/scroll'

const positions = {
  top: 'items-start justify-center with-backdrop',
  bottom: 'items-end justify-center with-backdrop',
  right: 'items-center justify-end with-backdrop',
  left: 'items-center justify-start with-backdrop'
}
const positionCSS = __THEME__ === 'mat'
  ? {
    maxHeight: '80vh',
    height: 'auto'
  }
  : {
    maxHeight: '80vh',
    height: 'auto',
    boxShadow: 'none'
  }

function additionalCSS (position) {
  let css = {}

  if (['left', 'right'].includes(position)) {
    css.maxWidth = '90vw'
  }
  if (__THEME__ === 'ios') {
    if (['left', 'top'].includes(position)) {
      css.borderTopLeftRadius = 0
    }
    if (['right', 'top'].includes(position)) {
      css.borderTopRightRadius = 0
    }
    if (['left', 'bottom'].includes(position)) {
      css.borderBottomLeftRadius = 0
    }
    if (['right', 'bottom'].includes(position)) {
      css.borderBottomRightRadius = 0
    }
  }

  return css
}

let
  duration = 200, // in ms -- synch with transition CSS from Modal
  openedModalNumber = 0

export default {
  name: 'q-modal',
  mixins: [ModelToggleMixin],
  props: {
    position: {
      type: String,
      default: '',
      validator (val) {
        return val === '' || ['top', 'bottom', 'left', 'right'].includes(val)
      }
    },
    transition: String,
    enterClass: String,
    leaveClass: String,
    positionClasses: {
      type: String,
      default: 'flex-center'
    },
    contentClasses: [Object, Array, String],
    contentCss: [Object, Array, String],
    noBackdropDismiss: {
      type: Boolean,
      default: false
    },
    noEscDismiss: {
      type: Boolean,
      default: false
    },
    minimized: Boolean,
    maximized: Boolean
  },
  watch: {
    $route () {
      this.hide()
    }
  },
  computed: {
    modalClasses () {
      const cls = this.position
        ? positions[this.position]
        : this.positionClasses
      if (this.maximized) {
        return ['maximized', cls]
      }
      else if (this.minimized) {
        return ['minimized', cls]
      }
      return cls
    },
    modalTransition () {
      if (this.position) {
        return `q-modal-${this.position}`
      }
      if (this.enterClass === void 0 && this.leaveClass === void 0) {
        return this.transition || 'q-modal'
      }
    },
    modalCss () {
      if (this.position) {
        const css = Array.isArray(this.contentCss)
          ? this.contentCss
          : [this.contentCss]

        css.unshift(extend(
          {},
          positionCSS,
          additionalCSS(this.position)
        ))

        return css
      }

      return this.contentCss
    }
  },
  methods: {
    show () {
      console.log('MODAL show')
      if (this.showing) {
        console.log('MODAL show already showing; promise.resolve')
        return Promise.resolve()
      }

      const body = document.body

      body.appendChild(this.$el)
      body.classList.add('with-modal')
      this.bodyPadding = window.getComputedStyle(body).paddingRight
      body.style.paddingRight = `${getScrollbarWidth()}px`
      EscapeKey.register(() => {
        if (!this.noEscDismiss) {
          this.hide().then(() => {
            this.$emit('escape-key')
          })
        }
      })

      setTimeout(() => {
        let content = this.$refs.content
        content.scrollTop = 0
        ;['modal-scroll', 'layout-view'].forEach(c => {
          [].slice.call(content.getElementsByClassName(c)).forEach(el => {
            el.scrollTop = 0
          })
        })
      }, 10)

      this.__updateModel(true)
      openedModalNumber++

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('MODAL show emitting show')
          this.$emit('show')
          resolve()
        }, duration)
      })
    },
    hide () {
      console.log('MODAL hide')
      if (!this.showing) {
        console.log('MODAL hide not showing; return promise.resolve')
        return Promise.resolve()
      }

      EscapeKey.pop()
      openedModalNumber--

      if (openedModalNumber === 0) {
        const body = document.body
        body.classList.remove('with-modal')
        body.style.paddingRight = this.bodyPadding
      }

      console.log('MODAL hide update model to false')
      this.__updateModel(false)
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('MODAL hide emitting hide')
          this.$emit('hide')
          resolve()
        }, duration)
      })
    },
    __dismiss () {
      console.log('MODAL __dismiss')
      if (this.noBackdropDismiss) {
        return
      }
      this.hide().then(() => {
        console.log('MODAL __dismiss emitting dismiss')
        this.$emit('dismiss')
      })
    }
  },
  beforeDestroy () {
    if (this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    }
  },
  render (h) {
    return h(QTransition, {
      props: {
        name: this.modalTransition,
        enter: this.enterClass,
        leave: this.leaveClass
      }
    }, [
      h('div', {
        staticClass: 'modal fullscreen row',
        'class': this.modalClasses,
        on: {
          click: this.__dismiss
        },
        directives: [{
          name: 'show',
          value: this.showing
        }]
      }, [
        h('div', {
          ref: 'content',
          staticClass: 'modal-content scroll',
          style: this.modalCss,
          'class': this.contentClasses,
          on: {
            click (e) {
              e.stopPropagation()
            },
            touchstart (e) {
              e.stopPropagation()
            }
          }
        }, [ this.$slots.default ])
      ])
    ])
  }
}
