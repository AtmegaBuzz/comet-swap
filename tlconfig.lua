return {
  source_dir = "src",
  include_dir = { "process/src/wusdc_bridge/typedefs", "process/src/", "process/packages/" },
  include = {
    "**/**.tl",
  },
  scripts = {
    build = {
      post = {
        "process/scripts/copy_lua_packages.lua",
      },
    },
  },
  build_dir = "build-lua",
  global_env_def = "ao",
  module_name = "amm",
  gen_target = "5.3",
  dont_prune = { }
}
