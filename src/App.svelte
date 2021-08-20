<script>
  import { plan, roadPlan } from './clients/aucklandtransport.js'

  const LOADING_STR = 'Loading from Auckland Transport...'
  $: ptPlan = LOADING_STR
  $: cyclePlan = LOADING_STR
  $: walkPlan = LOADING_STR
  $: drivePlan = LOADING_STR

  plan().then(data => {
    ptPlan = JSON.stringify(data, '', 2)
  })
  roadPlan('cycle').then(data => {
    cyclePlan = JSON.stringify(data, '', 2)
  })
  roadPlan('walk').then(data => {
    walkPlan = JSON.stringify(data, '', 2)
  })
  roadPlan('drive').then(data => {
    drivePlan = JSON.stringify(data, '', 2)
  })


</script>

<main>
  <h1>govhack2021</h1>
  <h2>directions via public transport</h2>
  <pre>{ptPlan}</pre>
  <h2>directions via cycling</h2>
  <pre>{cyclePlan}</pre>
  <h2>directions via walking</h2>
  <pre>{walkPlan}</pre>
  <h2>directions via driving</h2>
  <pre>{drivePlan}</pre>


</main>

<style>
  main {
    padding: 1em;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    font-size: 4em;
    font-weight: 100;
  }

  pre {
    font-family: 'Consolas', 'monospace';
    max-height: 350px;
    color: #fff;
    background: #222;
    overflow: scroll;
  }
</style>
