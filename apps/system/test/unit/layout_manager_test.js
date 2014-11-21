/* global MocksHelper, LayoutManager, MockKeyboardManager,
          MocksoftwareButtonManager, MockLockScreen,
          MockAppWindowManager, MockSystem */
'use strict';

require('/shared/test/unit/mocks/mock_system.js');
requireApp('system/js/layout_manager.js');
requireApp('system/test/unit/mock_lock_screen.js');
requireApp('system/test/unit/mock_keyboard_manager.js');
requireApp('system/test/unit/mock_app_window_manager.js');
requireApp('system/test/unit/mock_software_button_manager.js');
require('/test/unit/mock_app_window.js');
require('/test/unit/mock_attention_window.js');
require('/js/input_window_manager.js');

var mocksForLayoutManager = new MocksHelper([
  'AppWindowManager',
  'KeyboardManager',
  'softwareButtonManager',
  'LockScreen',
  'System',
  'AttentionWindow'
]).init();

suite('system/LayoutManager >', function() {
  mocksForLayoutManager.attachTestHelpers();

  var layoutManager;
  setup(function() {
    MockAppWindowManager.mActiveApp = {
      isFullScreenLayout: function() {
        return false;
      }
    };
    window.lockScreen = MockLockScreen;
    layoutManager = new LayoutManager();
    layoutManager.start();
  });

  suite('handle events', function() {
    test('resize', function() {
      var stubPublish = this.sinon.stub(layoutManager, 'publish');
      layoutManager.handleEvent({
        type: 'resize'
      });
      assert.isFalse(layoutManager.keyboardEnabled);
      assert.isTrue(stubPublish.calledWith('system-resize'));
      assert.isTrue(stubPublish.calledWith('orientationchange'));
    });

    test('attention-inactive', function() {
      var stubPublish = this.sinon.stub(layoutManager, 'publish');
      layoutManager.handleEvent({
        type: 'attention-inactive'
      });
      assert.isTrue(stubPublish.calledWith('system-resize'));
    });

    test('keyboardchange', function() {
      var stubPublish = this.sinon.stub(layoutManager, 'publish');
      layoutManager.handleEvent({
        type: 'keyboardchange'
      });
      assert.isTrue(stubPublish.calledWith('system-resize'));
      assert.isTrue(layoutManager.keyboardEnabled);
    });

    test('keyboardhide', function() {
      var stubPublish = this.sinon.stub(layoutManager, 'publish');
      layoutManager.handleEvent({
        type: 'keyboardhide'
      });
      assert.isTrue(stubPublish.calledWith('system-resize'));
      assert.isFalse(layoutManager.keyboardEnabled);
    });

    test('mozfullscreenchange', function() {
      var stubPublish = this.sinon.stub(layoutManager, 'publish');
      layoutManager.handleEvent({
        type: 'mozfullscreenchange'
      });
      assert.isTrue(stubPublish.calledWith('system-resize'));
    });

    test('software-button-enabled', function() {
      var stubPublish = this.sinon.stub(layoutManager, 'publish');
      layoutManager.handleEvent({
        type: 'software-button-enabled'
      });
      assert.isTrue(stubPublish.calledWith('system-resize'));
    });

    test('software-button-disabled', function() {
      var stubPublish = this.sinon.stub(layoutManager, 'publish');
      layoutManager.handleEvent({
        type: 'software-button-disabled'
      });
      assert.isTrue(stubPublish.calledWith('system-resize'));
    });
  });

  suite('height calculation', function() {
    var realDPX, stubDPX;
    var realIH, stubIH;
    var H, W;
    setup(function() {
      stubDPX = 1;
      realDPX = window.devicePixelRatio;

      stubIH = 545;
      realIH = window.innerHeight;

      Object.defineProperty(window, 'devicePixelRatio', {
        configurable: true,
        get: function() { return stubDPX; }
      });

      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        get: function() { return stubIH; }
      });

      H = window.innerHeight;
      W = window.innerWidth;
    });

    teardown(function() {
      Object.defineProperty(window, 'devicePixelRatio', {
        configurable: true,
        get: function() { return realDPX; }
      });

      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        get: function() { return realIH; }
      });

      MockSystem.locked = false;
    });

    test('should take into account keyboard and home button',
    function() {
      var _w = document.documentElement.clientWidth;
      MockKeyboardManager.mHeight = 100;
      MocksoftwareButtonManager.height = 50;
      layoutManager.keyboardEnabled = true;
      assert.equal(layoutManager.height, H - 100 - 50);
      assert.equal(layoutManager.width, W);
      assert.equal(layoutManager.clientWidth, _w);
      assert.isTrue(layoutManager.match(W, H - 100 - 50));
    });

    test('should take into account keyboard and home button with' +
         'full screen layout',
      function() {
        this.sinon.stub(MockAppWindowManager.mActiveApp, 'isFullScreenLayout')
          .returns(true);
        var _w = document.documentElement.clientWidth;
        MockKeyboardManager.mHeight = 100;
        MocksoftwareButtonManager.height = 50;
        layoutManager.keyboardEnabled = true;
        assert.equal(layoutManager.height, H - 100);
        assert.equal(layoutManager.width, W);
        assert.equal(layoutManager.clientWidth, _w);
        assert.isTrue(layoutManager.match(W, H - 100));
      });

    test('should take into account keyboard and home button with' +
         'full screen layout',
      function() {
        this.sinon.stub(MockAppWindowManager.mActiveApp, 'isFullScreenLayout')
          .returns(true);
        var _w = document.documentElement.clientWidth;
        MockKeyboardManager.mHeight = 100;
        MocksoftwareButtonManager.height = 50;
        layoutManager.keyboardEnabled = true;
        assert.equal(layoutManager.height, H - 100);
        assert.equal(layoutManager.width, W);
        assert.equal(layoutManager.clientWidth, _w);
        assert.isTrue(layoutManager.match(W, H - 100));
      });

    test('should take into account keyboard and home button with' +
         'full screen layout, but screen is locked',
      function() {
        MockSystem.locked = true;
        this.sinon.stub(MockAppWindowManager.mActiveApp, 'isFullScreenLayout')
          .returns(true);
        MockKeyboardManager.mHeight = 100;
        MocksoftwareButtonManager.height = 50;
        layoutManager.keyboardEnabled = true;
        // Even though the software home button is enabled and reports a height
        // its height should not affect the lockscreen
        assert.equal(layoutManager.height, H - 100);
      });

    test('should return integral values in device pixels', function() {
      stubDPX = 1.5;
      assert.equal((layoutManager.height * stubDPX) % 1, 0);
    });
  });

  suite('dimensions >', () => {
    var H, W, _w;
    setup(() => {
      H = window.innerHeight;
      W = window.innerWidth;
      _w = document.documentElement.clientWidth;
      MockKeyboardManager.mHeight = 100;
      MocksoftwareButtonManager.height = 50;
      MocksoftwareButtonManager.width = 50;
    });

    test('height calculation with keyboard enabled', () => {
      layoutManager.keyboardEnabled = true;
      assert.equal(layoutManager.height, H - 100 - 50);
      assert.isTrue(layoutManager.match(W - 50, H - 100 - 50));
    });

    test('height calculation with keyboard disabled', () => {
      layoutManager.keyboardEnabled = false;
      assert.equal(layoutManager.height, H - 50);
      assert.isTrue(layoutManager.match(W - 50, H - 50));
    });

    test('width calculation', () => {
      assert.equal(layoutManager.width, W - 50);
      assert.equal(layoutManager.clientWidth, _w);
    });
  });

  suite('getHeightFor()', function() {
    setup(function() {
      MocksoftwareButtonManager.height = 50;
      MockSystem.locked = false;
    });

    test('should return the height for regular windows', function() {
      assert.equal(layoutManager.height, layoutManager.getHeightFor({}));
    });

    test('should return the height for regular windows on lockscreen',
      function() {
        MockSystem.locked = true;
        assert.equal(layoutManager.height, layoutManager.getHeightFor({}));
      });

    test('should consider SHB on attention windows and lockscreen', function() {
      MockSystem.locked = true;
      var attentionWindow = new window.AttentionWindow();
      assert.operator(layoutManager.getHeightFor({}), '>',
        layoutManager.getHeightFor(attentionWindow));
    });
  });
});
