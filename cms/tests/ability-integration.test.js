/**
 * Integration Tests for Role Abilities System
 * Tests the observer pattern implementation and all role abilities
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const GAME_CODE = 'GAME_MAIN';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
};

class AbilityTester {
  constructor() {
    this.baseURL = BASE_URL;
    this.gameCode = GAME_CODE;
    this.testResults = [];
  }

  // Helper to make API calls
  async apiCall(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        timeout: TEST_CONFIG.timeout,
      };

      if (data) {
        config.headers = { 'Content-Type': 'application/json' };
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500,
      };
    }
  }

  // Get game state
  async getGameState() {
    return await this.apiCall('GET', `/api/v1/game/state?gameCode=${this.gameCode}`);
  }

  // Get ability status for a player
  async getAbilityStatus(playerCode, abilityName = null) {
    const endpoint = abilityName
      ? `/api/v1/game/ability?playerCode=${playerCode}&abilityName=${abilityName}`
      : `/api/v1/game/ability?playerCode=${playerCode}`;
    return await this.apiCall('GET', endpoint);
  }

  // Execute an ability
  async executeAbility(playerCode, abilityName, targetCode = null) {
    const data = { playerCode, abilityName };
    if (targetCode) data.targetCode = targetCode;
    return await this.apiCall('POST', '/api/v1/game/ability', data);
  }

  // Test helper to log results
  logTest(testName, passed, details = '') {
    const result = { testName, passed, details, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    console.log(`${passed ? '✅' : '❌'} ${testName}${details ? ': ' + details : ''}`);
  }

  // Test 1: API Health Check
  async testAPIHealth() {
    console.log('\n🏥 Testing API Health...');

    const gameState = await this.getGameState();
    this.logTest(
      'Game State API',
      gameState.success && gameState.data?.success,
      gameState.success ? 'Game state retrieved' : gameState.error
    );

    return gameState.success;
  }

  // Test 2: Ability Status Endpoint
  async testAbilityStatusEndpoint() {
    console.log('\n📊 Testing Ability Status Endpoint...');

    const gameState = await this.getGameState();
    if (!gameState.success) {
      this.logTest('Ability Status Endpoint', false, 'Cannot get game state');
      return false;
    }

    const players = gameState.data.gameState?.players || [];
    const alivePlayer = players.find(p => p.isAlive);

    if (!alivePlayer) {
      this.logTest('Ability Status Endpoint', false, 'No alive players found');
      return false;
    }

    // Test getting all abilities for a player
    const allAbilities = await this.getAbilityStatus(alivePlayer.id);
    this.logTest(
      'Get All Abilities',
      allAbilities.success && allAbilities.data?.abilities,
      allAbilities.success
        ? `Found ${allAbilities.data.abilities?.length || 0} abilities for ${alivePlayer.role}`
        : allAbilities.error
    );

    // Test getting specific ability status
    if (allAbilities.success && allAbilities.data?.abilities?.length > 0) {
      const firstAbility = allAbilities.data.abilities[0];
      const specificAbility = await this.getAbilityStatus(alivePlayer.id, firstAbility.name);
      this.logTest(
        'Get Specific Ability',
        specificAbility.success && specificAbility.data?.abilityName === firstAbility.name,
        specificAbility.success
          ? `Retrieved ${firstAbility.name} ability status`
          : specificAbility.error
      );
    }

    return allAbilities.success;
  }

  // Test 3: Kill Ability (Murderer)
  async testKillAbility() {
    console.log('\n⚔️ Testing Kill Ability...');

    const gameState = await this.getGameState();
    if (!gameState.success) return false;

    const players = gameState.data.gameState?.players || [];
    const murderer = players.find(p => p.isAlive && p.role === 'murderer');
    const victim = players.find(p => p.isAlive && p.role !== 'murderer');

    if (!murderer) {
      this.logTest('Kill Ability', false, 'No alive murderer found');
      return false;
    }

    if (!victim) {
      this.logTest('Kill Ability', false, 'No potential victim found');
      return false;
    }

    // Check kill ability status
    const abilityStatus = await this.getAbilityStatus(murderer.id, 'kill');
    this.logTest(
      'Kill Ability Status',
      abilityStatus.success,
      abilityStatus.success
        ? `Can use: ${abilityStatus.data?.canUse}, Cooldown: ${abilityStatus.data?.cooldownRemaining}s`
        : abilityStatus.error
    );

    // Execute kill if possible
    if (abilityStatus.success && abilityStatus.data?.canUse) {
      const killResult = await this.executeAbility(murderer.id, 'kill', victim.id);
      this.logTest(
        'Execute Kill',
        killResult.success && killResult.data?.success,
        killResult.success
          ? killResult.data?.message
          : killResult.error
      );

      // Check cooldown after kill
      if (killResult.success) {
        const postKillStatus = await this.getAbilityStatus(murderer.id, 'kill');
        this.logTest(
          'Post-Kill Cooldown',
          postKillStatus.success && !postKillStatus.data?.canUse,
          postKillStatus.success
            ? `Cooldown: ${postKillStatus.data?.cooldownRemaining}s`
            : postKillStatus.error
        );
      }
    }

    return true;
  }

  // Test 4: Investigate Ability (Detective)
  async testInvestigateAbility() {
    console.log('\n🔍 Testing Investigate Ability...');

    const gameState = await this.getGameState();
    if (!gameState.success) return false;

    const players = gameState.data.gameState?.players || [];
    const detective = players.find(p => p.isAlive && p.role === 'detective');
    const target = players.find(p => p.isAlive && p.id !== detective?.id);

    if (!detective) {
      this.logTest('Investigate Ability', false, 'No alive detective found');
      return false;
    }

    if (!target) {
      this.logTest('Investigate Ability', false, 'No investigation target found');
      return false;
    }

    // Check investigate ability status
    const abilityStatus = await this.getAbilityStatus(detective.id, 'investigate');
    this.logTest(
      'Investigate Ability Status',
      abilityStatus.success,
      abilityStatus.success
        ? `Can use: ${abilityStatus.data?.canUse}`
        : abilityStatus.error
    );

    // Execute investigation if possible
    if (abilityStatus.success && abilityStatus.data?.canUse) {
      const investigateResult = await this.executeAbility(detective.id, 'investigate', target.id);
      this.logTest(
        'Execute Investigation',
        investigateResult.success && investigateResult.data?.success,
        investigateResult.success
          ? investigateResult.data?.message
          : investigateResult.error
      );
    }

    return true;
  }

  // Test 5: Revive Ability (Reviver)
  async testReviveAbility() {
    console.log('\n🧚 Testing Revive Ability...');

    const gameState = await this.getGameState();
    if (!gameState.success) return false;

    const players = gameState.data.gameState?.players || [];
    const reviver = players.find(p => p.isAlive && p.role === 'reviver');
    const deadPlayer = players.find(p => !p.isAlive);

    if (!reviver) {
      this.logTest('Revive Ability', false, 'No alive reviver found');
      return false;
    }

    if (!deadPlayer) {
      this.logTest('Revive Ability', false, 'No dead player to revive');
      return false;
    }

    // Check revive ability status
    const abilityStatus = await this.getAbilityStatus(reviver.id, 'revive');
    this.logTest(
      'Revive Ability Status',
      abilityStatus.success,
      abilityStatus.success
        ? `Can use: ${abilityStatus.data?.canUse}`
        : abilityStatus.error
    );

    // Execute revive if possible
    if (abilityStatus.success && abilityStatus.data?.canUse) {
      const reviveResult = await this.executeAbility(reviver.id, 'revive', deadPlayer.id);
      this.logTest(
        'Execute Revive',
        reviveResult.success && reviveResult.data?.success,
        reviveResult.success
          ? reviveResult.data?.message
          : reviveResult.error
      );
    }

    return true;
  }

  // Test 6: Protect Ability (Bodyguard)
  async testProtectAbility() {
    console.log('\n🛡️ Testing Protect Ability...');

    const gameState = await this.getGameState();
    if (!gameState.success) return false;

    const players = gameState.data.gameState?.players || [];
    const bodyguard = players.find(p => p.isAlive && p.role === 'bodyguard');
    const target = players.find(p => p.isAlive && p.id !== bodyguard?.id);

    if (!bodyguard) {
      this.logTest('Protect Ability', false, 'No alive bodyguard found');
      return false;
    }

    if (!target) {
      this.logTest('Protect Ability', false, 'No protection target found');
      return false;
    }

    // Check protect ability status
    const abilityStatus = await this.getAbilityStatus(bodyguard.id, 'protect');
    this.logTest(
      'Protect Ability Status',
      abilityStatus.success,
      abilityStatus.success
        ? `Can use: ${abilityStatus.data?.canUse}`
        : abilityStatus.error
    );

    // Execute protection if possible
    if (abilityStatus.success && abilityStatus.data?.canUse) {
      const protectResult = await this.executeAbility(bodyguard.id, 'protect', target.id);
      this.logTest(
        'Execute Protection',
        protectResult.success && protectResult.data?.success,
        protectResult.success
          ? protectResult.data?.message
          : protectResult.error
      );
    }

    return true;
  }

  // Test 7: Grinch Mimic Ability
  async testGrinchMimicAbility() {
    console.log('\n👹 Testing Grinch Mimic Ability...');

    const gameState = await this.getGameState();
    if (!gameState.success) return false;

    const players = gameState.data.gameState?.players || [];
    const grinch = players.find(p => p.isAlive && p.role === 'troll');
    const target = players.find(p => p.isAlive && p.id !== grinch?.id && p.role !== 'murderer');

    if (!grinch) {
      this.logTest('Grinch Mimic Ability', false, 'No alive grinch found');
      return false;
    }

    if (!target) {
      this.logTest('Grinch Mimic Ability', false, 'No safe mimic target found');
      return false;
    }

    // Check mimic ability status
    const abilityStatus = await this.getAbilityStatus(grinch.id, 'grinch_mimic');
    this.logTest(
      'Grinch Mimic Ability Status',
      abilityStatus.success,
      abilityStatus.success
        ? `Can use: ${abilityStatus.data?.canUse}`
        : abilityStatus.error
    );

    // Execute mimic if possible
    if (abilityStatus.success && abilityStatus.data?.canUse) {
      const mimicResult = await this.executeAbility(grinch.id, 'grinch_mimic', target.id);
      this.logTest(
        'Execute Mimic',
        mimicResult.success && mimicResult.data?.success,
        mimicResult.success
          ? mimicResult.data?.message
          : mimicResult.error
      );
    }

    return true;
  }

  // Test 8: Error Handling
  async testErrorHandling() {
    console.log('\n🚨 Testing Error Handling...');

    // Test invalid player code
    const invalidPlayer = await this.getAbilityStatus('INVALID_PLAYER');
    this.logTest(
      'Invalid Player Code',
      !invalidPlayer.success || invalidPlayer.data?.success === false,
      'Should reject invalid player codes'
    );

    // Test invalid ability name
    const gameState = await this.getGameState();
    if (gameState.success) {
      const players = gameState.data.gameState?.players || [];
      const player = players.find(p => p.isAlive);

      if (player) {
        const invalidAbility = await this.executeAbility(player.id, 'invalid_ability');
        this.logTest(
          'Invalid Ability Name',
          !invalidAbility.success || invalidAbility.data?.success === false,
          'Should reject invalid ability names'
        );

        // Test ability without required target
        const noTarget = await this.executeAbility(player.id, 'kill');
        this.logTest(
          'Missing Required Target',
          !noTarget.success || noTarget.data?.success === false,
          'Should reject abilities that require targets when no target provided'
        );
      }
    }

    return true;
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 Starting Ability System Integration Tests...\n');

    const tests = [
      this.testAPIHealth,
      this.testAbilityStatusEndpoint,
      this.testKillAbility,
      this.testInvestigateAbility,
      this.testReviveAbility,
      this.testProtectAbility,
      this.testGrinchMimicAbility,
      this.testErrorHandling,
    ];

    let passedTests = 0;
    const totalTests = tests.length;

    for (const test of tests) {
      try {
        const result = await test.call(this);
        if (result) passedTests++;
      } catch (error) {
        console.error(`❌ Test failed with error: ${error.message}`);
      }
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    // Detailed results
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.passed ? '✅' : '❌'} ${result.testName}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    });

    return passedTests === totalTests;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AbilityTester();
  tester.runAllTests()
    .then((allPassed) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = AbilityTester;