# @jacobbubu/gitlab-ci-npmrc

> Used to generate `.npmrc` files in the gitlab ci pipeline.

## Usage

in `.gitlab-ci.yml`:

``` yaml
  script:
    - |
      npx @jacobbubu/gitlab-ci-npmrc ./.npmrc

  artifacts:
    when: always
    paths:
      - .npmrc
```

`@jacobbubu/gitlab-ci-npmrc` will generate the url of the npm registry based on the namespace and project id of the current project, if the key already exists in `.npmc`, the value of the key will be preserved.
